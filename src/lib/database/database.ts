import { docClient } from "./dynamo"
import { PutCommand, GetCommand, ScanCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import bcrypt from 'bcryptjs';

type User = {
    email: string,
    password: string,
    firstname: string,
    lastname: string
}

async function updateReoccuringBills(bills: any): Promise<void> {
    const command = new UpdateCommand({
        TableName: "reoccuringbills",
        Key: { email: bills.email},
        UpdateExpression: "SET bills = :newBills",
        ExpressionAttributeValues: {
            ":newBills": bills.bills
        }
    });

    try {
        await docClient.send(command);
        console.log("Yay i did it!");
    } catch(err) {
        console.log("Error: ", err);
    }
}

async function updatePaydate(paydate: any): Promise<void> {
    const command = new UpdateCommand({
        TableName: "reoccuringbills",
        Key: { email: paydate.email },
        UpdateExpression: "SET paydate = :paydate, frequency = :frequency",
        ExpressionAttributeValues: {
            ":paydate": paydate.timestamp,
            ":frequency": paydate.frequency
        }
    });

    try {
        await docClient.send(command);
        console.log("Updated");
    } catch(err) {
        console.error("Error: ", err);
    }
}

async function getReoccuringBills(email: string): Promise<any> {
    const command = new QueryCommand({
        TableName: "reoccuringbills",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
            ":email": email
        }
    })

    try {
        const response = await docClient.send(command);
        return response.Items[0]?.bills;
    } catch (err) {
        console.error("Error: ", err);
    }
}

async function uploadNewCard(item: any): Promise<void> {
    const command: PutCommand = new PutCommand({
        TableName: "cards",
        Item: item
    })

    try {
        await docClient.send(command);
        console.log("Item Added!");
    } catch (err) {
        console.error("Error: ", err);
    }
}

async function getAllCardsByUser(userid: string): Promise<any[]> {
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

async function signupUser(user: User): Promise<void> {
    try {
        const salt: any = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(user.password, salt);

        const hashedUser: User = { 
            email: user.email,
            password: hashedPassword,
            firstname: user.firstname,
            lastname: user.lastname
        }

        const command: PutCommand = new PutCommand ({
            TableName: "users",
            Item: hashedUser
        });

        await docClient.send(command);
        console.log("User Added!");
    } catch(err) {
        console.log("Error: ", err);
    }
}

async function authenticateUser(user: User): Promise<boolean> {
    const command = new QueryCommand({
        TableName: "users",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
            ":email" : user.email
        }
    });

    try {
        const response = await docClient.send(command);
        
        if (response.Items.length > 0) {
            if (bcrypt.compare(user.password, response.Items[0].password))
                return true;
        } else
            return false;
    } catch (err) {
        console.log("Error: ", err);
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

export { uploadNewCard,
    getAllCards,
    getAllCardsByUser,
    authenticateUser,
    signupUser,
    getReoccuringBills,
    updateReoccuringBills,
    updatePaydate
};
export type { User };