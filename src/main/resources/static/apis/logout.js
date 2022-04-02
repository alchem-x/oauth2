export default async function logout({ accessToken }) {
    const body = new URLSearchParams()
    body.append('accessToken', accessToken)
    const response = await fetch('/api/logout', {
        method: 'POST',
        body,
    })
    const result = await response.json()
    if (!response.ok) {
        throw new Error(result.error)
    }
    return result
}