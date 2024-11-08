package errors

import (
	"fmt"
	"runtime"

	"gorm.io/gorm"
)

type AppError struct {
	Code      int         `json:"code"`
	Message   string      `json:"message"`
	Details   interface{} `json:"details,omitempty"`
	Stack     string      `json:"-"`
	OrigError error       `json:"-"`
}

func (e *AppError) Error() string {
	if e.OrigError != nil {
		return fmt.Sprintf("Code: %d, Message: %s, Original Error: %v", e.Code, e.Message, e.OrigError)
	}
	return fmt.Sprintf("Code: %d, Message: %s", e.Code, e.Message)
}

func New(code int, details interface{}, originalErr error) *AppError {
	_, file, line, _ := runtime.Caller(1)
	stack := fmt.Sprintf("%s:%d", file, line)

	message, exists := errorMessages[code]
	if !exists {
		message = errorMessages[ErrCodeInternalServer]
	}

	return &AppError{
		Code:      code,
		Message:   message,
		Details:   details,
		Stack:     stack,
		OrigError: originalErr,
	}
}

func HandleDBError(err error) *AppError {
	if err == gorm.ErrRecordNotFound {
		return New(ErrCodeNotFound, nil, err)
	}

	return New(ErrCodeDBConnection, nil, err)
}

func NewValidationError(details interface{}) *AppError {
	return New(ErrCodeValidation, details, nil)
}

func NewNotFoundError(details interface{}) *AppError {
	return New(ErrCodeNotFound, details, nil)
}

func NewDatabaseError(err error) *AppError {
	return New(ErrCodeDBConnection, nil, err)
}

func NewCacheError(details interface{}) *AppError {
	return New(ErrCodeDBConnection, details, nil)
}

func NewTagNotFoundError(id interface{}) *AppError {
	details := map[string]interface{}{"id": id}
	return New(ErrCodeTagNotFound, details, nil)
}

func NewInvalidUUIDError(uuidStr string) *AppError {
	details := map[string]interface{}{"uuid": uuidStr}
	return New(ErrCodeInvalidUUID, details, nil)
}

func NewTagValidationError(details interface{}) *AppError {
	return New(ErrCodeValidation, details, nil)
}
