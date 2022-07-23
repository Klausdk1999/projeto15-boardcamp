import connection from '../dbStrategy/postgres.js';
import joi from 'joi';

export async function getPosts(req, res) {
  const { rows: posts } = await connection.query(`
    SELECT posts.id, posts.titulo, users.nome as author FROM posts
    JOIN users
    ON posts.userid = users.id
  `);

  res.send(posts);
}

export async function getPostById(req, res) {
  const { id } = req.params;

  const { rows: post } = await connection.query(
    `
      SELECT posts.titulo, posts.post, posts.id, users.nome FROM posts
      JOIN user_posts
      ON posts.id = user_posts.postid
      JOIN users
      ON users.id = user_posts.userid
      WHERE posts.id = $1
    `,
    [id]
  );

  // query sem passar pelo javascrip
  console.log(post);

  const postJoin = {
    ...post[0],
    users: post.map(value => value.nome)
  };

  delete postJoin.nome;

  res.send(postJoin);
}

export async function createPost(req, res) {
  const newPost = req.body;

  const postSchema = joi.object({
    titulo: joi.string().required(),
    post: joi.string().required(),
    userid: joi.number().required()
  });

  const { error } = postSchema.validate(newPost);

  if (error) {
    return res.sendStatus(422);
  }

  await connection.query(
    `INSERT INTO posts (titulo, post, userid) VALUES ('${newPost.titulo}', '${newPost.post}', '${newPost.userid}')`
  );

  res.status(201).send('Post criado com sucesso');
}
