# File Changer AWS CDK

Contains the backend code for the file changer application. 

The file changer application was created to test features from an array of aws services. The react web application hosted through aws amplify takes two inputs. One of plain text call input text and another an input .txt file called input file. Once submitted, the frontend uploads the file to an S3 bucket and then posts the input text and S3 path of the input file to an API gateway endpoint that passes the data to a lambda function (input-process-handler). 

In the lambda function (input-process-handler), a random ID is generated and then the 3 attributes, input text, S3 path, and id are added as an entry to a dynamoDB table. Once the entry is added, a separate lambda function (ec2-trigger-handler) is called from the dynamoDB stream trigger. This lambda function (ec2-trigger-handler), downloads a prexisting python script (see scripts/scripts.py), and spawns an ec2 instance that runs the script. In order to run the script, bash commands are passed in first as userData and downloads the necessary dependencies, creates the file on the instance as the script, and then runs the script. 

The script itself, gets the dynamoDb entry via the id, downloads the input file using the s3 path, appends the input text to the input file, adds a new file to the S3 bucket called [input_file_name]_output.txt, updates the dynamoDB entry with the S3 path of the output file and finally, terminates itself, the ec2 instance.

## Setup

Install dependencies`npm install`

cd into input-process-handler lambda code and install dependencies `cd lambda/input-process-handler && npm install && cd ../..`

cd into ec2-trigger-handler lambda code and install dependencies `cd lambda/ec2-trigger-handler && npm install && cd ../..`

Login via `aws sso login --profile <PROFILE NAME>`, if not done before

Bootstrap cdk environment `cdk bootstrap aws://<AWS_ACCOUNT_NUMBER>/us-east-1 --profile <PROFILE NAME>`.

To deploy the whole stack run `cdk deploy -all --profile <PROFILE NAME>`
