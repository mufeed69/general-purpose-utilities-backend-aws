const {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand,
} = require('@aws-sdk/client-apigatewaymanagementapi')

const api_gateway_client = new ApiGatewayManagementApiClient({
    endpoint: process.env.EMIT_ENDPOINT,
})

const user = {}       // userId => connectionId
const connection = {} // connectionId => userId

async function postToConnected(currentConnectionId, payload) {
    console.log('Connected users:', user)

    for (const userId in user) {
        if (Object.hasOwnProperty.call(user, userId)) {
            const connectionId = user[userId]

            if (connectionId !== currentConnectionId && connectionId) {
                const command = new PostToConnectionCommand({
                    Data: Buffer.from(JSON.stringify(payload)),
                    ConnectionId: connectionId,
                })

                try {
                    await api_gateway_client.send(command)
                    console.log(`Message sent to connection: ${connectionId}`)
                } catch (error) {
                    console.error(`Failed to send to connection ${connectionId}:`, error)
                }
            }
        }
    }
}

module.exports.handler = async (event) => {
    try {
        console.log('Incoming event:', JSON.stringify(event))

        const { routeKey, connectionId } = event.requestContext

        if (routeKey === '$connect') {
            const userId = event.queryStringParameters?.user_id
            if (!userId) {
                return {
                    statusCode: 400,
                    body: 'Missing user_id query parameter',
                }
            }

            user[userId] = connectionId
            connection[connectionId] = userId

            console.log(`🔌 User ${userId} connected with ID ${connectionId}`)

            return {
                statusCode: 200,
                body: 'Connection established successfully',
            }
        }

        if (routeKey === '$disconnect') {
            const userId = connection[connectionId]
            delete user[userId]
            delete connection[connectionId]
            console.log(`User ${userId} disconnected`)
            return {
                statusCode: 200,
                body: 'Connection cleared successfully',
            }
        }

        if (routeKey === '$default') {
            const payload = JSON.parse(event.body || '{}')
            await postToConnected(connectionId, payload)
            return {
                statusCode: 200,
                body: 'Message broadcasted',
            }
        }

        return {
            statusCode: 400,
            body: 'Invalid route',
        }
    } catch (error) {
        console.error('Error in WebSocket handler:', error)
        return {
            statusCode: 500,
            body: 'Internal server error',
        }
    }
}
