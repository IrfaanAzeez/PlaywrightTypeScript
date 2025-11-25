/**
 * Test Data Fixtures
 * Pre-defined test data for common scenarios
 */

export const UserFixtures = {
  validUser: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
  },

  validUser2: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+0987654321',
  },

  updateData: {
    firstName: 'Johnny',
    lastName: 'Updated',
  },

  invalidEmail: {
    firstName: 'Invalid',
    lastName: 'User',
    email: 'not-an-email',
  },

  missingRequired: {
    firstName: 'Missing',
    // email is required but missing
  },

  specialCharacters: {
    firstName: 'José',
    lastName: "O'Brien",
    email: 'jose.obrien@example.com',
  },

  longName: {
    firstName: 'A'.repeat(100),
    lastName: 'Z'.repeat(100),
    email: 'long.name@example.com',
  },
};

export const ErrorMessages = {
  invalidEmail: 'Invalid email format',
  missingField: 'Required field missing',
  unauthorized: 'Unauthorized',
  forbidden: 'Forbidden',
  notFound: 'Not found',
  conflict: 'Resource already exists',
  serverError: 'Internal server error',
};

export const StatusCodes = {
  ok: 200,
  created: 201,
  noContent: 204,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
  serverError: 500,
};

export const Endpoints = {
  users: '/users',
  userById: (id: string | number) => `/users/${id}`,
  searchUsers: '/users/search',
  bulkUsers: '/users/bulk',
  exportUsers: '/users/export',
};
