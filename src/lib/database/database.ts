import axios from "axios";

type User = {
    email: string,
    password: string,
    firstname: string,
    lastname: string
}

async function updateReoccuringBills(bills: any): Promise<void> {
    await axios.patch("https://smbbb2dbae.execute-api.us-east-1.amazonaws.com/v01/updateReoccuringBills", {
        email: bills.email,
        bills: bills.bills,
        frequency: bills.frequency,
        paydate: bills.paydate,
    }, {
        headers: {
            "Content-Type": "application/json", // This is optional if API Gateway already allows all origins
        }
    })
    .then(res => console.log(res.data))
    .catch(err => console.error("Error:", err));
}

async function updatePaydate(paydate: any): Promise<void> {
    await axios.patch("https://smbbb2dbae.execute-api.us-east-1.amazonaws.com/v01/updatePayDate",
        {
            email: paydate.email,
            timestamp: paydate.timestamp,
            frequency: paydate.frequency
        },
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    )
    .then(res => console.log(res.data))
    .catch(err => console.error("Error: ", err));
}

async function getReoccuringBills(email: string): Promise<any> {
    try {
        const response = await axios.get("https://smbbb2dbae.execute-api.us-east-1.amazonaws.com/v01/getReoccurringBills", {
            params: {
                email: email
            }
        });
        console.log(response.data);
        return response.data.data;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

async function uploadNewCard(item: any): Promise<void> {
    await axios.put("https://smbbb2dbae.execute-api.us-east-1.amazonaws.com/v01/uploadNewCard",
        item,
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    )
    .then(res => console.log(res.data))
    .catch(err => console.error("Error: ", err));
}

async function getAllCardsByUser(userid: string): Promise<any[]> {
    try {
        const response = await axios.get("https://smbbb2dbae.execute-api.us-east-1.amazonaws.com/v01/getAllCardsByUser", {
            params: {
                userid: userid
            }
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error("Error: ", error);
        throw error;
    }
}

async function signupUser(user: User): Promise<void> {
    await axios.post("https://smbbb2dbae.execute-api.us-east-1.amazonaws.com/v01/signupUser",
        user,
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    )
    .then(res => console.log(res.data))
    .catch(err => console.error("Error: ", err));
}

async function authenticateUser(user: User): Promise<boolean> {
    try {
        const response = await axios.post("https://smbbb2dbae.execute-api.us-east-1.amazonaws.com/v01/authenticateUser",
            user,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        console.log(response.data);
        return response.data;
    } catch (err) {
        console.error("Error: ", err);
        return false;
    }
}

export { uploadNewCard,
    getAllCardsByUser,
    authenticateUser,
    signupUser,
    getReoccuringBills,
    updateReoccuringBills,
    updatePaydate
};
export type { User };