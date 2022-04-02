export default async function login({ username, password }) {
    const body = new URLSearchParams()
    body.append('username', username)
    body.append('password', password)
    const response = await fetch('/api/login', {
        method: 'POST',
        body,
    })
    const result = await response.json()
    if (!response.ok) {
        throw new Error(result.error)
    }
    return result
}