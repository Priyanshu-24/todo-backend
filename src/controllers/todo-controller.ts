import { Validation } from '@helpers';
import {
  AppContext,
  Errors,
  ExtendedRequest,
  ValidationFailure,
} from '@typings';
import { NextFunction, Router, Response } from 'express';
import { createTodoValidator } from '@validators';
import { BaseController } from './base-controller';
import { Todo } from '@models';

export class TodoController extends BaseController {
  public basePath: string = '/todos';
  public router: Router = Router();

  constructor(ctx: AppContext) {
    super(ctx);
    this.initializeRoute();
  }

  private initializeRoute() {
    this.router.post(
      `${this.basePath}`,
      createTodoValidator(this.appContext),
      this.createTodo,
    );
    this.router.delete(`${this.basePath}/:id`, this.deleteTodo);
  }

  private createTodo = async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const failures: ValidationFailure[] =
      Validation.extractValidationErrors(req);
    if (failures.length > 0) {
      const valError = new Errors.ValidationError(
        res.__('VALIDATION_ERRORS.INVALID_TITLE'),
        failures,
      );
      return next(valError);
    }

    const { title } = req.body;
    const todo = await this.appContext.todoRepository.save(
      new Todo({
        title,
      }),
    );
    res.status(201).json(todo.serialize());
  }

  private deleteTodo = async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const failures: ValidationFailure[] =
        Validation.extractValidationErrors(req);
      if (failures.length > 0) {
        const valError = new Errors.ValidationError(
          res.__('DEFAULT_ERRORS.VALIDATION_FAILED'),
          failures,
        );
        return next(valError);
      }
      const { id } = req.params;
      const response = await this.appContext.todoRepository.deleteMany({
        _id: id,
      });
      if (response.deletedCount > 0) {
        res.status(204);
        res.end();
      } else {
        throw new Error('todo not found');
      }
    } catch (err) {
      const valError = new Errors.ValidationError(
        res.__('DEFAULT_ERRORS.INVALID_REQUEST'),
        err,
      );
      return next(valError);
    }
  }
}
