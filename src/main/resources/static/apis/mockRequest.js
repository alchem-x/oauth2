export default async function mockRequest({ accessToken }) {
    const response = await fetch('/api/mockRequest', {
        headers: {
            AccessToken: accessToken
        },
    })
    const result = await response.json()
    if (!response.ok) {
        const error = new Error(result.error)
        error.status = response.status
        throw error
    }
    return result
}