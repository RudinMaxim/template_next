package logger

import (
	"context"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/fatih/color"
)

type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARNING
	ERROR
)

type LogEntry struct {
	Level     LogLevel
	Message   string
	Timestamp time.Time
	Fields    map[string]interface{}
}

type AsyncLogger struct {
	logChan      chan LogEntry
	wg           sync.WaitGroup
	file         *os.File
	ctx          context.Context
	cancel       context.CancelFunc
	bufferSize   int
	workerCount  int
	isDev        bool
	debugColor   *color.Color
	infoColor    *color.Color
	warningColor *color.Color
	errorColor   *color.Color
}

func NewAsyncLogger(ctx context.Context, cancel context.CancelFunc, filename string, bufferSize, workerCount int, isDev bool) (*AsyncLogger, error) {
	file, err := os.OpenFile(filename, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return nil, fmt.Errorf("failed to open log file: %w", err)
	}

	logger := &AsyncLogger{
		logChan:      make(chan LogEntry, bufferSize),
		file:         file,
		ctx:          ctx,
		cancel:       cancel,
		bufferSize:   bufferSize,
		workerCount:  workerCount,
		isDev:        isDev,
		debugColor:   color.New(color.FgCyan),
		infoColor:    color.New(color.FgGreen),
		warningColor: color.New(color.FgYellow),
		errorColor:   color.New(color.FgRed, color.Bold),
	}

	for i := 0; i < workerCount; i++ {
		logger.wg.Add(1)
		go logger.worker()
	}

	return logger, nil
}

func (l *AsyncLogger) worker() {
	defer l.wg.Done()

	for {
		select {
		case entry := <-l.logChan:
			l.writeLog(entry)
		case <-l.ctx.Done():
			for {
				select {
				case entry := <-l.logChan:
					l.writeLog(entry)
				default:
					return
				}
			}
		}
	}
}

func (l *AsyncLogger) writeLog(entry LogEntry) {
	timeFormat := "15:04:05.000"
	if !l.isDev {
		timeFormat = time.RFC3339
	}

	timestamp := entry.Timestamp.Format(timeFormat)
	levelStr := l.getLevelString(entry.Level)

	logLine := fmt.Sprintf("[%s] [%s] %s", timestamp, levelStr, entry.Message)

	if len(entry.Fields) > 0 {
		logLine += fmt.Sprintf(" Fields: %v", entry.Fields)
	}
	logLine += "\n"

	fmt.Println(logLine)

	if _, err := l.file.WriteString(logLine); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to write to log file: %v\n", err)
	}

	if l.isDev {
		var coloredOutput *color.Color
		switch entry.Level {
		case DEBUG:
			coloredOutput = l.debugColor
		case INFO:
			coloredOutput = l.infoColor
		case WARNING:
			coloredOutput = l.warningColor
		case ERROR:
			coloredOutput = l.errorColor
		}

		timeStr := color.New(color.FgHiBlack).Sprint(timestamp)
		levelStr := coloredOutput.Sprint(levelStr)
		message := entry.Message

		consoleLog := fmt.Sprintf("%s %-8s %s", timeStr, levelStr, message)
		if len(entry.Fields) > 0 {
			consoleLog += color.HiBlackString(" Fields: %v", entry.Fields)
		}
		fmt.Println(consoleLog)
	}
}

func (l *AsyncLogger) Log(level LogLevel, message string, fields map[string]interface{}) {
	entry := LogEntry{
		Level:     level,
		Message:   message,
		Timestamp: time.Now(),
		Fields:    fields,
	}

	select {
	case l.logChan <- entry:
	default:
		fmt.Fprintf(os.Stderr, "Log buffer is full, dropping message: %s\n", message)
	}
}

func (l *AsyncLogger) Debug(message string, fields map[string]interface{}) {
	l.Log(DEBUG, message, fields)
}

func (l *AsyncLogger) Info(message string, fields map[string]interface{}) {
	l.Log(INFO, message, fields)
}

func (l *AsyncLogger) Warning(message string, fields map[string]interface{}) {
	l.Log(WARNING, message, fields)
}

func (l *AsyncLogger) Error(message string, fields map[string]interface{}) {
	l.Log(ERROR, message, fields)
}

func (l *AsyncLogger) Shutdown() error {
	l.cancel()
	l.wg.Wait()
	return l.file.Close()
}

func (l *AsyncLogger) getLevelString(level LogLevel) string {
	switch level {
	case DEBUG:
		return "DEBUG"
	case INFO:
		return "INFO"
	case WARNING:
		return "WARN"
	case ERROR:
		return "ERROR"
	default:
		return "UNKNOWN"
	}
}
