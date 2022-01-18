require('module-alias/register');

import chai from 'chai';
// tslint:disable-next-line: import-name
import spies from 'chai-spies';
chai.use(spies);
import chaiHttp from 'chai-http';
import { Application } from 'express';
import { respositoryContext, testAppContext } from '../../mocks/app-context';

import { App } from '../../../src/server';
import { Todo } from '../../../src/models';

chai.use(chaiHttp);
const expect = chai.expect;
let expressApp: Application;

before(async () => {
  await respositoryContext.store.connect();
  const app = new App(testAppContext);
  app.initializeMiddlewares();
  app.initializeControllers();
  app.initializeErrorHandling();
  expressApp = app.expressApp;
});

describe('POST /todos', () => {
  it('should create a todo when valid title is passed ', async () => {
    const res = await chai.request(expressApp).post('/todos').send({
      title: 'This is my title',
    });

    expect(res).to.have.status(201);
    expect(res.body).to.have.property('id');
    expect(res.body).to.have.property('title');
  });

  it('should return a validation error if title is an empty string.', async () => {
    const res = await chai.request(expressApp).post('/todos').send({
      title: '',
    });

    expect(res).to.have.status(400);
    expect(res.body.message).to.equal('Please provide a title.');
  });
});

describe('DELETE /todos/:id', () => {
  it('item is present in the database', async () => {
    const title = 'my new todo';
    const todoItem = await testAppContext.todoRepository.save(
      new Todo({ title })
    );
    const res = await chai.request(expressApp).delete(`/todos/${todoItem._id}`);

    expect(res).to.have.status(204);
  });

  it('item is not present in the database', async () => {
    const id = '420';
    const res = await chai.request(expressApp).delete(`/todos/${id}`);

    expect(res).to.have.status(400);
  });
});

describe('GET /todos/:id', () => {
  it('item is present in the database', async () => {
    const title = 'my new todo';
    const response = await testAppContext.todoRepository.save(
      new Todo({ title })
    );
    const res = await chai.request(expressApp).get(`/todos/${response._id}`);

    expect(res).to.have.status(200);
    expect(res.body).to.have.property('id');
    expect(res.body).to.have.property('title');

    //both the IDs must be equal
    expect(response.body.id).to.equal(res.body.id);
  });

  it('item is not present in the database', async () => {
    const id = '420';
    const res = await chai.request(expressApp).get(`/todos/${id}`);

    expect(res).to.have.status(404);
  });
});
