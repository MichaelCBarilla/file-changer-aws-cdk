#!/usr/bin/env python3

# NOTE: Changing this file's name requires a change in ec2-trigger-handler, scriptKey variable.

import sys
import subprocess
import os
import boto3

# Terminate EC2 instance
def terminate_ec2_instance(region, instance_id):
    try:
        ec2_client = boto3.client('ec2', region_name=region)
        response = ec2_client.terminate_instances(
            InstanceIds=[instance_id]
        )
        print('Instance terminated successfully:', response)
    except Exception as e:
        print('Error terminating instance:', e)


def get_item_from_dynamodb(region, table_name, key):
    dynamodb = boto3.resource('dynamodb', region_name=region)
    table = dynamodb.Table(table_name)
    response = table.get_item(Key=key)
    return response.get('Item', {})

def download_file_from_s3(region, bucket_name, object_key, local_file_path):
    s3 = boto3.client('s3', region_name=region)
    s3.download_file(bucket_name, object_key, local_file_path)

def upload_file_to_s3(region, bucket_name, object_key, local_file_path):
    s3 = boto3.client('s3', region_name=region)
    s3.upload_file(local_file_path, bucket_name, object_key)

def update_item_in_dynamodb(region, table_name, key, new_s3_path):
    dynamodb = boto3.client('dynamodb', region_name=region)
    response = dynamodb.update_item(
        TableName=table_name,
        Key=key,
        UpdateExpression='SET output_file_path = :val',
        ExpressionAttributeValues={':val': {'S': new_s3_path}},
        ReturnValues='UPDATED_NEW'
    )
    return response

def check_arguments():
    if len(sys.argv) != 5:
        print('Script needs 4 arguments! python script.py <AWS_REGION> <DYNAMO_DB_TABLE_NAME> <ID> <S3_BUCKET_NAME> ')
        sys.exit(1)

def main():
    try:
      check_arguments()
      region = sys.argv[1]

      dynamodb_table_name = sys.argv[2]
      id = sys.argv[3]
      dynamodb_key = {'id': id}

      s3_bucket_name = sys.argv[4]

      #  Get item from DynamoDB
      item = get_item_from_dynamodb(region, dynamodb_table_name, dynamodb_key)

      #  Download file from S3
      local_file_path = 'input_file.txt'
      s3_object_key = item['input_file_path']
      download_file_from_s3(region, s3_bucket_name, s3_object_key, local_file_path)

      # Modify file
      with open(local_file_path, 'a') as file:
        file.write(' : {0}'.format(item['input_text']))

      file_name = s3_object_key.split('/', 1)[-1]
      output_file_name = f'{file_name[:-4]}_output.txt'
      os.rename(local_file_path, output_file_name)

      # Upload modified file to S3 as a new object
      new_object_key = f'{s3_bucket_name}/{output_file_name}'
      upload_file_to_s3(region, s3_bucket_name, new_object_key, output_file_name)

      # Update item in DynamoDB with new S3 path
      update_dynamodb_key = {'id': {'S': id}}
      update_item_in_dynamodb(region, dynamodb_table_name, update_dynamodb_key, new_object_key)
    except Exception as e:
      print('error trying to run script, execption below...')
      print(e)
    finally:
      # Terminate Instace
      result = subprocess.run(['ec2-metadata', '-i'], capture_output=True, text=True)
      instance_id = result.stdout.replace('instance-id: ', '').strip()
      terminate_ec2_instance(region, instance_id)

if __name__ == '__main__':
    main()
    print('success')
