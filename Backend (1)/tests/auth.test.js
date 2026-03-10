const test = require('node:test');
const assert = require('node:assert');
const { setUser, getUser } = require('../src/services/auth'); // Adjust path if your auth.js is somewhere else

test('Auth Service - JWT Token Generation and Verification', (t) => {
    // 1. Arrange: Create a fake user payload
    const mockUser = {
        id: "DOC-999",
        email: "test@hospital.com",
        role: "DOCTOR"
    };

    // 2. Act: Generate the token
    const token = setUser(mockUser);

    // 3. Assert: Verify token is a string
    assert.strictEqual(typeof token, 'string', "Token should be a string");

    // 4. Act: Decode the token
    const decodedUser = getUser(token);

    // 5. Assert: Verify the data matches exactly
    assert.strictEqual(decodedUser.id, "DOC-999", "Decoded ID should match");
    assert.strictEqual(decodedUser.role, "DOCTOR", "Decoded Role should match");
});