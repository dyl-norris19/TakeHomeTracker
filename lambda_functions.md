#updatePaydate
```
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
    const REGION = "us-east-1";
    const client = new DynamoDBClient({ region: REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    try {
        const paydate = event;

        const command = new UpdateCommand({
            TableName: "reoccuringbills",
            Key: { email: paydate.email },
            UpdateExpression: "SET paydate = :paydate, frequency = :frequency",
            ExpressionAttributeValues: {
                ":paydate": paydate.timestamp,
                ":frequency": paydate.frequency
            }
        });

        await docClient.send(command);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Paydate updated successfully" }),
        };
    } catch (err) {
        console.error("Error updating paydate:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Error updating paydate",
                error: err.message
            }),
        };
    }
};
```
#authenticateUser
```
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";

const REGION = "us-east-1";
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const user = event;

    const command = new QueryCommand({
        TableName: "users",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
            ":email": user.email
        }
    });

    try {
        const response = await docClient.send(command);

        if (response.Items.length > 0) {
            const match = await bcrypt.compare(user.password, response.Items[0].password);
            return {
                statusCode: 200,
                body: JSON.stringify({ authenticated: match })
            };
        } else {
            return {
                statusCode: 401,
                body: JSON.stringify({ authenticated: false, message: "User not found" })
            };
        }
    } catch (err) {
        console.error("Error: ", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" })
        };
    }
};
```
#getReoccuringBills
```
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";

const REGION = "us-east-1";
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const user = event;

    const command = new QueryCommand({
        TableName: "users",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
            ":email": user.email
        }
    });

    try {
        const response = await docClient.send(command);

        if (response.Items.length > 0) {
            const match = await bcrypt.compare(user.password, response.Items[0].password);
            return {
                statusCode: 200,
                body: JSON.stringify({ authenticated: match })
            };
        } else {
            return {
                statusCode: 401,
                body: JSON.stringify({ authenticated: false, message: "User not found" })
            };
        }
    } catch (err) {
        console.error("Error: ", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" })
        };
    }
};
```
#getAllCardsByUser
```
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const REGION = "us-east-1";
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const queryParams = event.queryStringParameters || {};
  const userid = queryParams.userid;

    const command = new QueryCommand({
        TableName: "cards",
        KeyConditionExpression: "userid = :uid",
        ExpressionAttributeValues: {
            ":uid": userid
        }
    });

    try {
        const response = await docClient.send(command);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
            },
            body: JSON.stringify(response.Items)
        };
    } catch (error) {
        console.error("Error querying items: ", error);

        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
            },
            body: JSON.stringify({
                message: "Error querying items",
                error: error.message
            })
        };
    }
};
```
#uploadNewCard
```
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
    const REGION = "us-east-1";
    const client = new DynamoDBClient({ region: REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    try {
        const item = event; // Use event directly, not event.body

        const command = new PutCommand({
            TableName: "cards",
            Item: item
        });

        await docClient.send(command);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "POST,OPTIONS"
            },
            body: JSON.stringify({ message: "Card uploaded successfully" })
        };
    } catch (err) {
        console.error("Error uploading card:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error uploading card", error: err.message })
        };
    }
};
```
#updateReoccuringbills
```
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
    const REGION = "us-east-1";
    const client = new DynamoDBClient({ region: REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    try {
        const item = event; // Use event directly, not event.body

        const command = new PutCommand({
            TableName: "cards",
            Item: item
        });

        await docClient.send(command);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "POST,OPTIONS"
            },
            body: JSON.stringify({ message: "Card uploaded successfully" })
        };
    } catch (err) {
        console.error("Error uploading card:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error uploading card", error: err.message })
        };
    }
};
```
#updatePaydate
```
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
    const REGION = "us-east-1";
    const client = new DynamoDBClient({ region: REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    try {
        const paydate = event;

        const command = new UpdateCommand({
            TableName: "reoccuringbills",
            Key: { email: paydate.email },
            UpdateExpression: "SET paydate = :paydate, frequency = :frequency",
            ExpressionAttributeValues: {
                ":paydate": paydate.timestamp,
                ":frequency": paydate.frequency
            }
        });

        await docClient.send(command);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Paydate updated successfully" }),
        };
    } catch (err) {
        console.error("Error updating paydate:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Error updating paydate",
                error: err.message
            }),
        };
    }
};
```
