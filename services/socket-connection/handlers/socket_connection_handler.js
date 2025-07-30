const {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand,
} = require('@aws-sdk/client-apigatewaymanagementapi')

const api_gateway_client = new ApiGatewayManagementApiClient({
    endpoint: process.env.EMIT_ENDPOINT,
})

const user = {

} 

const connection = {

}

async function postToConnected(currentConnectionId, payload) {
    // Iterate over all user IDs
    for (const userId in user) {
        if (user.hasOwnProperty(userId)) {
            const connectionId = connection[userId]

            // Skip the current user's connection ID
            if (connectionId !== currentConnectionId && connectionId) {
                const command = new PostToConnectionCommand({
                    Data: JSON.stringify(payload),
                    ConnectionId: connectionId,
                })

                try {
                    // Send the message to the connection
                    await api_gateway_client.send(command)
                    console.log(`Message sent to connection: ${connectionId}`)
                } catch (error) {
                    console.error(`Failed to send message to connection: ${connectionId}`, error)
                }
            }
        }
    }
}

module.exports.handler = async (event) => {
    try {
        const { routeKey, connectionId } = event.requestContext

        if (routeKey === '$connect') {
            // Store connection session information
            user[event.queryStringParameters.user_id] = connectionId
            connection[connectionId] = event.queryStringParameters.user_id
            return {
                statusCode: 200,
                body: JSON.stringify('Connection established successfully'),
            }
        }

        if (routeKey === '$disconnect') {
            delete user[connection[connectionId]]
            return {
                statusCode: 200,
                body: JSON.stringify('Connection cleared successfully'),
            }
        }

        if (routeKey === 'broadcast-massage') {
            const payload = JSON.parse(event.body)
            await postToConnected(connectionId, payload)
            return {
                statusCode: 200,
                body: JSON.stringify('Connection cleared successfully'),
            }
        }

        // Handle other route keys if needed
        return {
            statusCode: 200,
            body: JSON.stringify('Invalid route'),
        }
    } catch (error) {
        console.error('Error in WebSocket handler:', error)
        return {
            statusCode: 200,
            body: JSON.stringify('There was an error while processing the connection'),
        }
    }
}
