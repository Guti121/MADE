// Error whose message is safe to send to the client (business-rule violations:
// "Insufficient stock", "Invalid unit", ...). Anything that is NOT an AppError
// is treated as an internal failure and hidden behind a generic 500.
export class AppError extends Error {
  constructor (message, status = 400) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.public = true
  }
}
