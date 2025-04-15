import { docClient } from "./dynamo"
import { PutCommand, GetCommand, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

async function uploadNewCard(item) {
    const command = new PutCommand({
        TableName: "cards",
        Item: item
    })

    try {
        await docClient.send(command);
        console.log("email added!");
    } catch (err) {
        console.error("Error: ", err);
    }
}

async function getAllCardsByUser(userid: string) {
    const command = new QueryCommand({
        TableName: "cards",
        KeyConditionExpression: "userid = :uid",
        ExpressionAttributeValues: {
            ":uid": userid
        }
    });

    try {
        const response = await docClient.send(command);
        return response.Items;
    } catch (error) {
        console.error("Error querying items: ", error);
        return [];
    }
}

async function getAllCards() {
    const command = new ScanCommand({
        TableName: "cards"
    })

    try {
        const result = await docClient.send(command);
        console.log("Items:", result.Items);
        return result.Items;
    } catch (err) {
        console.error("Error scanning table: ", err);
    }
}

export { uploadNewCard, getAllCards, getAllCardsByUser };