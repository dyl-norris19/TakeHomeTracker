import { docClient } from "./dynamo"
import { PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

async function bruh() {
    const command = new PutCommand({
        TableName: "users",
        Item: {
            email: "rawr@gmail.com",
            name: "yamomma"
        }
    })

    try {
        await docClient.send(command);
        console.log("email added!");
    } catch (err) {
        console.error("Error: ", err);
    }
}

async function getAll() {
    const command = new ScanCommand({
        TableName: "users"
    })

    try {
        const result = await docClient.send(command);
        console.log("Items:", result.Items);
        return result.Items;
    } catch (err) {
        console.error("Error scanning table: ", err);
    }
}

export { bruh, getAll };