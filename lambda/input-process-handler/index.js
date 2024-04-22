import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { nanoid } from 'nanoid';

export const handler = async (event) => {
  const region = process.env.REGION;
  
  const dynamoDBClient = new DynamoDBClient({ region });
  const tableName = process.env.DYNAMO_DB_TABLE_NAME;

  const body = JSON.parse(event.body);
  const id = nanoid();
  const inputText = body.inputText;
  const inputFilePath = body.inputFilePath;

  const params = {
    TableName: tableName,
    Item: {
      'id': { S: id },
      'input_text': { S: inputText },
      'input_file_path': { S: inputFilePath },
    }
  };

  try {
    const extension = inputFilePath.substring(inputFilePath.length - 4);
    if (extension != '.txt') {
      throw new Error('not .txt file');
    }
    const data = await dynamoDBClient.send(new PutItemCommand(params));
    console.log('Item added successfully:', data);
    return { 
      statusCode: 200, 
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data), 
    };
  } catch (error) {
    console.error('Error adding item:', error);
    return { 
      statusCode: 500, 
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(error), 
    };
  }
};