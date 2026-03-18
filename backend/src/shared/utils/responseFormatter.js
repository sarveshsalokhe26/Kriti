/**
 * Standardized Response Format Utility
 * All API responses follow this format for consistency
 */

/**
 *Sucess response format
 *Parameters
 *1.Data,The data of the success response which we are gonna return Ex,For returning user details like userID, Email,Phone
 *2.Message,The success message Ex.You're password was successfully verified
 *3.statuscode,HTTP status code for successfull communication with the server
 */
function successResponse(data, message = "Success", statusCode = 200) {
  return {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 *Error response format
 *Parameters
 *1.code,possible error code
 *2.message,The error message
 *3.status code,The http status code for error
 */
function errorResponse(code, message, statusCode = 400, details = null) {
  return {
    success: false,
    statusCode,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    },
  };
}

/**
 * Pagination response wrapper
 * 1.Items,Array of the product that the user is gonna ask for, or the products we're gonna return to the user
 * 2.Total,Total no of products are available and to be returned to the user
 * 3.Page,The current page the user is located on so that we can calculate whether he can reach further or not 
 * 4.Limit, The limit of poducts that can be depicted at each pageso that user does not have to scroll infinite
 */
function paginatedResponse(items, total, page, limit, message = "Success") {
  return {
    success: true,
    statusCode: 200,
    message,
    data: {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    },
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};