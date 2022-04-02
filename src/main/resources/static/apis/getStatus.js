export default async function getStatus({ accessToken }) {
    const response = await fetch('/api/status', {
        headers: {
            AccessToken: accessToken
        },
    })
    const result = await response.json()
    if (!response.ok) {
        throw new Error(result.error)
    }
    return result
}