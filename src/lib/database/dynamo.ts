import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";


const REGION = import.meta.env.VITE_REGION;
const ACCESS_KEY = import.meta.env.VITE_ACCESS_KEY;
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

const client = new DynamoDBClient({
    region: REGION,
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY
    }
});

const docClient = DynamoDBDocumentClient.from(client);

export { docClient };