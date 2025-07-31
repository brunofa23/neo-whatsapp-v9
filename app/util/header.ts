type GetHeadersOptions = {
  withAuthorization?: boolean
  withFile?: boolean
  withFormData?: boolean
}

function getHeaders(options: GetHeadersOptions = { withAuthorization: true, withFile: false, withFormData: false }) {
  const headers: Record<string, string> = {}

  // if (options.withAuthorization) {
  //   headers.Authorization = `Bearer ${sessionUser.token.token}`
  // }
  // if (options.withFormData || options.withFile) {
  //   headers["Content-Type"] = "multipart/form-data"
  // } else {
     headers["Content-Type"] = "application/json"
  // }

  headers["Access-Control-Allow-Origin"] = "*"
  headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, PUT, DELETE, OPTIONS"

  return { headers }
}

export { getHeaders }
