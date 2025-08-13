import type { MockInstance } from 'vitest';

import { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getLoggerInstance } from '../logger';
import {
  AppError,
  EnqueueTaskError,
  getErrDetails,
  handleError,
  UnexpectedStateError,
  UserError,
  WebhookError,
} from './errorUtils';

describe('errorUtils', () => {
  describe('getErrDetails', () => {
    it('should return details for an Error object', () => {
      const error = new Error('Test Error');
      error.stack = 'Error: Test Error\n    at <anonymous>';
      const details = getErrDetails(error);
      expect(details).toEqual({
        message: 'Test Error',
        name: 'Error',
        stack: 'Error: Test Error\n    at <anonymous>',
      });
    });

    it('should return details for an AppError object', () => {
      const appError = new AppError('App Error', {
        code: 'BAD_REQUEST',
        statusCode: 400,
      });
      const details = getErrDetails(appError);
      expect(details).toEqual({
        details: { code: 'BAD_REQUEST', statusCode: 400 },
        message: 'App Error',
        name: 'AppError',
        stack: expect.any(String), // AppError has a stack
      });
    });

    it('should handle null or undefined input', () => {
      expect(getErrDetails(null)).toEqual({
        message: 'null',
        name: 'NonErrorPrimitive',
      });
      expect(getErrDetails(undefined)).toEqual({
        message: 'undefined',
        name: 'NonErrorPrimitive',
      });
    });

    it('should handle empty object input', () => {
      expect(getErrDetails({})).toEqual({
        message: '[object Object]',
        name: 'NonErrorPrimitive',
      });
    });

    it('should handle string input', () => {
      expect(getErrDetails('Just a string error')).toEqual({
        message: 'Just a string error',
        name: 'NonErrorPrimitive',
      });
    });

    it('should handle number input', () => {
      expect(getErrDetails(123)).toEqual({
        message: '123',
        name: 'NonErrorPrimitive',
      });
    });

    it('should handle object with message but no name or stack', () => {
      const error = { message: 'Custom message' };
      expect(getErrDetails(error)).toEqual({
        message: 'Custom message',
        name: 'NonErrorObject',
      });
    });
  });

  describe('handleError', () => {
    let errorSpy: MockInstance;
    let mockRequest: Request;
    let mockResponse: Response;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {} as Request;
      mockResponse = {
        headersSent: false,
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as unknown as Response;
      mockNext = vi.fn() as unknown as NextFunction;
      errorSpy = vi.spyOn(getLoggerInstance(), 'error');
    });

    afterEach(() => {
      errorSpy.mockRestore();
      vi.clearAllMocks();
    });

    it('should set status and json for AppError with custom statusCode', () => {
      const error = new AppError('Test App Error', { statusCode: 404 });
      handleError(error, mockRequest, mockResponse, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          details: { statusCode: 404 },
          message: 'Test App Error',
          name: 'AppError',
        },
      });
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should set default status 500 for non-AppError', () => {
      const error = new Error('Generic Error');
      handleError(error, mockRequest, mockResponse, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          message: 'Generic Error',
          name: 'Error',
        },
      });
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should include stack in development and exclude in production', () => {
      const error = new Error('Stack Test');

      // Development environment
      process.env.NODE_ENV = 'development';
      handleError(error, mockRequest, mockResponse, mockNext);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.objectContaining({
          message: 'Stack Test',
          stack: expect.any(String),
        }),
      });
      vi.clearAllMocks();

      // Production environment
      process.env.NODE_ENV = 'production';
      handleError(error, mockRequest, mockResponse, mockNext);
      const response = (mockResponse.json as any).mock.calls[0][0];
      expect(response.error).not.toHaveProperty('stack');
    });

    it('should call logger.error with correct arguments', () => {
      const error = new Error('Log Test');
      handleError(error, mockRequest, mockResponse, mockNext);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(Object) }),
        'Error caught by error handling middleware',
      );
    });

    it('should call next if headers are already sent', () => {
      const error = new Error('Headers Sent');
      mockResponse.headersSent = true;
      handleError(error, mockRequest, mockResponse, mockNext);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('Custom Error Classes', () => {
    it('WebhookError should have correct name and details', () => {
      const error = new WebhookError('Webhook failed', {
        code: 'WEBHOOK_ERROR',
        statusCode: 400,
      });
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('WebhookError');
      expect(error.message).toBe('Webhook failed');
      expect(error.details).toEqual({ code: 'WEBHOOK_ERROR', statusCode: 400 });
    });

    it('EnqueueTaskError should have correct name and details', () => {
      const error = new EnqueueTaskError('Failed to enqueue', {
        code: 'ENQUEUE_FAILED',
        statusCode: 500,
      });
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('EnqueueTaskError');
      expect(error.message).toBe('Failed to enqueue');
      expect(error.details).toEqual({
        code: 'ENQUEUE_FAILED',
        statusCode: 500,
      });
    });

    it('UnexpectedStateError should have correct name and extras', () => {
      const error = new UnexpectedStateError('Unexpected state occurred', {
        context: 'someFunction',
      });
      expect(error.name).toBe('UnexpectedStateError');
      expect(error.message).toBe('Unexpected state occurred');
      expect(error.extras).toEqual({ context: 'someFunction' });
    });

    it('UserError should have correct name and extras', () => {
      const error = new UserError('Invalid input from user', {
        input: 'bad data',
      });
      expect(error.name).toBe('UserError');
      expect(error.message).toBe('Invalid input from user');
      expect(error.extras).toEqual({ input: 'bad data' });
    });
  });
});
