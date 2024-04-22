import { EC2Client, RunInstancesCommand } from '@aws-sdk/client-ec2';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export const handler = async (event, context, callback) => {
    const region = process.env.REGION;

    const ec2Client = new EC2Client({ region });
    const ec2ProfileArn = process.env.EC2_PROFILE_ARN;
    const amazonLinux2 = 'ami-051f8a213df8bc089';
    const instanceType = 't2.micro';
    const securityGroupIds = [process.env.SECURITY_GROUP_ID];
    const subnetId = process.env.SUBNET_ID;

    const s3Client = new S3Client({ region });
    const bucketName = process.env.S3_BUCKET_NAME;
    const scriptKey = 'script.py';

    const tableName = process.env.DYNAMO_DB_TABLE_NAME;

    try {
        for (const record of event.Records) {
            if (record.eventName !== 'INSERT') {
                console.log(`Skipping record with eventName: ${record.eventName}`);
                continue; 
            }
            const newImage = record.dynamodb.NewImage;
            const newItem = unmarshall(newImage);

            const scriptParams = {
                Bucket: bucketName,
                Key: scriptKey
            };
            const getObjectCommand = new GetObjectCommand(scriptParams);
            const { Body: scriptStream } = await s3Client.send(getObjectCommand);

            const scriptContent = await streamToString(scriptStream);

            const userData = `#!/bin/bash

            sudo yum update -y
            sudo yum install python3-pip -y

            sudo pip3 install boto3

            sudo echo "${scriptContent}" > ./script.py
            sudo chmod +x ./script.py
            sudo python3 ./script.py ${region} ${tableName} ${newItem.id} ${bucketName}`;



            const params = {
                ImageId: amazonLinux2,
                InstanceType: instanceType,
                MaxCount: 1,
                MinCount: 1,
                UserData: Buffer.from(userData).toString('base64'),
                SecurityGroupIds: securityGroupIds,
                SubnetId: subnetId,
                IamInstanceProfile: {
                  Arn: ec2ProfileArn,
                },
            };

            const command = new RunInstancesCommand(params);
            const data = await ec2Client.send(command);
            console.log('Ec2 instance created, ID:', data.Instances[0].InstanceId);
        }

        await ec2Client.destroy();
        return callback(null, { message: 'success' })
    } catch (err) {
        await ec2Client.destroy();
        console.error('Error creating instance:', err);
        return callback(null, 'Error caught')
    }
};

async function streamToString(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
}
