// Netlify Serverless Function: LINE Bot Push Message
// Replaces api/line_bot.php for Netlify deployment

exports.handler = async (event) => {
    // Handle CORS preflight
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json; charset=utf-8'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    let data;
    try {
        data = JSON.parse(event.body);
    } catch (e) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid JSON body' })
        };
    }

    if (!data || !data.token || !data.message || !data.to) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing token, to (group_id), or message' })
        };
    }

    const payload = {
        to: data.to,
        messages: [
            {
                type: 'text',
                text: data.message
            }
        ]
    };

    try {
        const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + data.token
            },
            body: JSON.stringify(payload)
        });

        const result = await response.text();

        return {
            statusCode: response.status,
            headers,
            body: result
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        };
    }
};
