package logger

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"os"
	"runtime"
	"sync"
	"time"

	"github.com/RudinMaxim/template/internal/config"
	"github.com/fatih/color"
)

type LogLevel = slog.Level

type Logger struct {
	logger       *slog.Logger
	logChan      chan entry
	wg           sync.WaitGroup
	file         *os.File
	ctx          context.Context
	cancel       context.CancelFunc
	opts         config.LoggerConfig
	debugColor   *color.Color
	infoColor    *color.Color
	warningColor *color.Color
	errorColor   *color.Color
}

type entry struct {
	level  LogLevel
	msg    string
	fields []any
	time   time.Time
}

type devHandler struct {
	out    io.Writer
	opts   *slog.HandlerOptions
	logger *Logger
}

const (
	LevelDebug = slog.LevelDebug
	LevelInfo  = slog.LevelInfo
	LevelWarn  = slog.LevelWarn
	LevelError = slog.LevelError
)

func DefaultOptions() config.LoggerConfig {
	return config.LoggerConfig{
		BufferSize:  1000,
		WorkerCount: 1,
		IsDev:       false,
		AddSource:   true,
		Dir:         "./loge",
		FileName:    "app.log",
		BaseAttributes: []slog.Attr{
			slog.String("service", "myapp"),
			slog.String("environment", "production"),
		},
	}
}

func NewLogger(ctx context.Context, filename string, opts config.LoggerConfig) (*Logger, error) {
	if ctx == nil {
		ctx = context.Background()
	}
	ctx, cancel := context.WithCancel(ctx)

	file, err := os.OpenFile(filename, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to open log file: %w", err)
	}

	logger := &Logger{
		logChan:      make(chan entry, opts.BufferSize),
		file:         file,
		ctx:          ctx,
		cancel:       cancel,
		opts:         opts,
		debugColor:   color.New(color.FgCyan),
		infoColor:    color.New(color.FgGreen),
		warningColor: color.New(color.FgYellow),
		errorColor:   color.New(color.FgRed, color.Bold),
	}

	handler := logger.newMultiHandler(file)
	logger.logger = slog.New(handler)

	for i := 0; i < opts.WorkerCount; i++ {
		logger.wg.Add(1)
		go logger.worker()
	}

	return logger, nil
}
func (l *Logger) newMultiHandler(file io.Writer) slog.Handler {
	opts := &slog.HandlerOptions{
		AddSource: l.opts.AddSource,
		Level:     LevelDebug,
	}

	var handlers []slog.Handler

	fileHandler := slog.NewJSONHandler(file, opts)
	handlers = append(handlers, fileHandler)

	if l.opts.IsDev {
		consoleHandler := l.newDevHandler(os.Stdout, opts)
		handlers = append(handlers, consoleHandler)
	}

	return &multiHandler{handlers: handlers}
}

type multiHandler struct {
	handlers []slog.Handler
}

func (h *multiHandler) Enabled(ctx context.Context, level slog.Level) bool {
	for _, handler := range h.handlers {
		if handler.Enabled(ctx, level) {
			return true
		}
	}
	return false
}

func (h *multiHandler) Handle(ctx context.Context, r slog.Record) error {
	for _, handler := range h.handlers {
		if err := handler.Handle(ctx, r); err != nil {
			return err
		}
	}
	return nil
}

func (h *multiHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	handlers := make([]slog.Handler, len(h.handlers))
	for i, handler := range h.handlers {
		handlers[i] = handler.WithAttrs(attrs)
	}
	return &multiHandler{handlers: handlers}
}

func (h *multiHandler) WithGroup(name string) slog.Handler {
	handlers := make([]slog.Handler, len(h.handlers))
	for i, handler := range h.handlers {
		handlers[i] = handler.WithGroup(name)
	}
	return &multiHandler{handlers: handlers}
}

func (l *Logger) newDevHandler(w io.Writer, opts *slog.HandlerOptions) slog.Handler {
	return &devHandler{
		out:    w,
		opts:   opts,
		logger: l,
	}
}

func (h *devHandler) Enabled(ctx context.Context, level slog.Level) bool {
	return level >= slog.Level(h.opts.Level.Level())
}

func (h *devHandler) Handle(ctx context.Context, r slog.Record) error {
	timeStr := h.logger.debugColor.Sprint(r.Time.Format("15:04:05.000"))

	var levelColor *color.Color
	switch r.Level {
	case LevelDebug:
		levelColor = h.logger.debugColor
	case LevelInfo:
		levelColor = h.logger.infoColor
	case LevelWarn:
		levelColor = h.logger.warningColor
	case LevelError:
		levelColor = h.logger.errorColor
	}

	levelStr := levelColor.Sprintf("%-5s", r.Level.String())

	var source string
	if h.opts.AddSource && r.PC != 0 {
		fs := runtime.CallersFrames([]uintptr{r.PC})
		f, _ := fs.Next()
		source = fmt.Sprintf(" %s:%d", f.File, f.Line)
	}

	var attrs string
	r.Attrs(func(a slog.Attr) bool {
		attrs += fmt.Sprintf(" %s=%v", a.Key, a.Value)
		return true
	})

	fmt.Fprintf(h.out, "%s %s%s %s%s\n",
		timeStr,
		levelStr,
		source,
		r.Message,
		color.HiBlackString(attrs),
	)
	return nil
}

func (h *devHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &devHandler{
		out:    h.out,
		opts:   h.opts,
		logger: h.logger,
	}
}

func (h *devHandler) WithGroup(name string) slog.Handler {
	return &devHandler{
		out:    h.out,
		opts:   h.opts,
		logger: h.logger,
	}
}

func (l *Logger) worker() {
	defer l.wg.Done()

	for {
		select {
		case entry := <-l.logChan:
			r := slog.NewRecord(entry.time, entry.level, entry.msg, 0)
			for i := 0; i < len(entry.fields); i += 2 {
				if i+1 < len(entry.fields) {
					r.Add(entry.fields[i].(string), entry.fields[i+1])
				}
			}
			if err := l.logger.Handler().Handle(l.ctx, r); err != nil {
				fmt.Fprintf(os.Stderr, "Failed to write log: %v\n", err)
			}
		case <-l.ctx.Done():
			return
		}
	}
}

func (l *Logger) Log(level LogLevel, msg string, args ...any) {
	entry := entry{
		level:  level,
		msg:    msg,
		fields: args,
		time:   time.Now(),
	}

	select {
	case l.logChan <- entry:
	default:
		fmt.Fprintf(os.Stderr, "Log buffer is full, dropping message: %s\n", msg)
	}
}

func (l *Logger) Debug(msg string, args ...any) {
	l.Log(LevelDebug, msg, args...)
}

func (l *Logger) Info(msg string, args ...any) {
	l.Log(LevelInfo, msg, args...)
}

func (l *Logger) Warn(msg string, args ...any) {
	l.Log(LevelWarn, msg, args...)
}

func (l *Logger) Error(msg string, args ...any) {
	l.Log(LevelError, msg, args...)
}

func (l *Logger) With(args ...any) *Logger {
	newLogger := *l
	newLogger.logger = l.logger.With(args...)
	return &newLogger
}

func (l *Logger) Shutdown(ctx context.Context) error {
	l.cancel()

	done := make(chan struct{})
	go func() {
		l.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
	case <-ctx.Done():
		return ctx.Err()
	}

	return l.file.Close()
}
