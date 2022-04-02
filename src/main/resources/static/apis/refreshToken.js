export default async function refreshToken({ refreshToken }) {
    const body = new URLSearchParams()
    body.append('refreshToken', refreshToken)
    const response = await fetch('/api/refreshToken', {
        method: 'POST',
        body,
    })
    const result = await response.json()
    if (!response.ok) {
        throw new Error(result.error)
    }
    return result
}