package errors

import "net/http"

// Error codes
const (
	// Common errors (1000-1999)
	ErrCodeBadRequest     = 1000
	ErrCodeValidation     = 1001
	ErrCodeNotFound       = 1002
	ErrCodeInternalServer = 1003
	ErrCodeInvalidUUID    = 1004

	// Tag specific errors (2000-2999)
	ErrCodeTagNotFound      = 2000
	ErrCodeTagAlreadyExists = 2001
	ErrCodeTagInvalidSlug   = 2002
	ErrCodeTagInvalidStatus = 2003
	ErrCodeTagMergeFailed   = 2004

	// Database errors (3000-3999)
	ErrCodeDBConnection = 3000
	ErrCodeDBDuplicate  = 3001
	ErrCodeDBConstraint = 3002
)

var (
	// Error messages mapping
	errorMessages = map[int]string{
		ErrCodeBadRequest:     "Некорректный запрос",
		ErrCodeValidation:     "Ошибка валидации",
		ErrCodeNotFound:       "Ресурс не найден",
		ErrCodeInternalServer: "Внутренняя ошибка сервера",
		ErrCodeInvalidUUID:    "Некорректный UUID",

		ErrCodeDBConnection: "Ошибка подключения к базе данных",
		ErrCodeDBDuplicate:  "Дублирование записи в базе данных",
		ErrCodeDBConstraint: "Нарушение ограничений базы данных",
	}

	// HTTP status code mapping
	httpStatusCodes = map[int]int{
		ErrCodeBadRequest:     http.StatusBadRequest,
		ErrCodeValidation:     http.StatusBadRequest,
		ErrCodeNotFound:       http.StatusNotFound,
		ErrCodeInternalServer: http.StatusInternalServerError,
		ErrCodeInvalidUUID:    http.StatusBadRequest,

		ErrCodeTagNotFound:      http.StatusNotFound,
		ErrCodeTagAlreadyExists: http.StatusConflict,
		ErrCodeTagInvalidSlug:   http.StatusBadRequest,
		ErrCodeTagInvalidStatus: http.StatusBadRequest,
		ErrCodeTagMergeFailed:   http.StatusInternalServerError,

		ErrCodeDBConnection: http.StatusInternalServerError,
		ErrCodeDBDuplicate:  http.StatusConflict,
		ErrCodeDBConstraint: http.StatusBadRequest,
	}
)
