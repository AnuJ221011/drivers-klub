
export async function getMMTToken() {
    // In production, this would make a request to MMT Auth API
    // For now, return a mock token
    return "mock-mmt-token-" + Date.now();
}
