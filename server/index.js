require('dotenv/config');
const express = require('express');
const errorMiddleware = require('./error-middleware');
const staticMiddleware = require('./static-middleware');
// const ClientError = require('./client-error');
const pg = require('pg');

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const app = express();
const jsonMiddleware = express.json();

// remove this when logins work, this is just for testing
const currentTestUserId = 1;

app.use(jsonMiddleware);

app.use(staticMiddleware);

app.post('/api/save-project', (req, res, next) => {
  const { projectName, html, css, javascript } = req.body;
  const sql = `
    insert into "projects" ("name", "html", "css", "javascript", "creatorId")
                    values ($1, $2, $3, $4, $5)
                 returning *
  `;
  const params = [projectName, html, css, javascript, currentTestUserId];
  db.query(sql, params)
    .then(result => {
      res.json(result.rows[0]);
    })
    .catch(err => next(err));
});

app.get('/api/view-my-projects', (req, res, next) => {
  const sql = `
       select "name", "projectId"
         from "projects"
        where "creatorId" = $1
  `;
  const params = [currentTestUserId];
  db.query(sql, params)
    .then(result => {
      res.json(result.rows);
    })
    .catch(err => next(err));
});

app.get('/api/view-project/:projectId', (req, res, next) => {
  const projectId = req.params.projectId;
  const sql = `
       select "html", "css", "javascript", "name"
         from "projects"
        where "projectId" = $1
  `;
  const params = [projectId];
  db.query(sql, params)
    .then(result => {
      res.json(result.rows[0]);
    })
    .catch(err => next(err));
});

app.patch('/api/update-project/:projectId', (req, res, next) => {
  const { html, css, javascript } = req.body;
  const projectId = req.params.projectId;
  const sql = `
       update "projects"
          set "html" = $2,
              "css" = $3,
              "javascript" = $4,
              "modifiedAt" = now()
        where "projectId" = $1
    returning *
  `;
  const params = [projectId, html, css, javascript];
  db.query(sql, params)
    .then(result => {
      res.json(result.rows[0]);
    })
    .catch(err => next(err));
});

app.delete('/api/delete-project/:projectId', (req, res, next) => {
  const projectId = req.params.projectId;
  const sql = `
    delete from "projects"
          where "projectId" = $1
      returning *
  `;
  const params = [projectId];
  db.query(sql, params)
    .then(result => {
      res.json(result.rows[0]);
    })
    .catch(err => next(err));
});

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`express server listening on port ${process.env.PORT}`);
});
