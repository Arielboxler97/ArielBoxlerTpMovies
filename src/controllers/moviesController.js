const db = require("../database/models");
const { Op, or } = require("sequelize");
const moment = require("moment");
const Actor_Movie = require("../database/models/Actor_Movie");

const moviesController = {
  list: (req, res) => {
    const movies = db.Movie.findAll({
      include: ["genre"],
    })
    
    const genres = db.Genre.findAll({
        order : ['name']
  })

  Promise.all([movies,genres])

    .then(([movies,genres]) => {
      res.render("moviesList.ejs", { movies, genres });
    });
  },
  detail: (req, res) => {
    db.Movie.findByPk(req.params.id).then((movie) => {
      res.render("moviesDetail.ejs", { ...movie.dataValues, moment });
    });
  },
  new: (req, res) => {
    db.Movie.findAll({
      order: [["release_date", "DESC"]],
      limit: 5,
    }).then((movies) => {
      res.render("newestMovies", { movies });
    });
  },
  recomended: (req, res) => {
    db.Movie.findAll({
      where: {
        rating: { [db.Sequelize.Op.gte]: 8 },
      },
      order: [["rating", "DESC"]],
    }).then((movies) => {
      res.render("recommendedMovies.ejs", { movies });
    });
  },
  //Aqui dispongo las rutas para trabajar con el CRUD
  add: function (req, res) {
    const actors = db.Actor.findAll({
      order : [
        ['first_name'],
        ['last_name']
    ]
    })

    const genres = db.Genre.findAll({
      order: ["name"],
    })

    Promise.all([actors,genres])
      .then(([actors,genres]) => {
        return res.render("moviesAdd", {
          actors,
          genres
        });
      })
      .catch((error) => console.log(error));
  },
  create: function (req, res) {
    const { title, rating, awards, release_date, length, genre_id } = req.body;

    db.Movie.create({
      title: title.trim(),
      rating,
      awards,
      release_date,
      length,
      genre_id,
      image : req.file ? req.filename : null
    })
      .then(() => {
        return res.redirect("/movies");
      })
      .catch((error) => console.log(error));
  },
  edit: function (req, res) {
    const genres = db.Genre.findAll({
      order: ["name"],
    });
    const movie = db.Movie.findByPk(req.params.id, {
      include: ["actors"],
    });

    const actors = db.Actor.findAll({
      order: [
        ["first_name", "ASC"],
        ["last_name", "ASC"],
      ],
    });

    Promise.all([genres, movie, actors])
      .then(([genres, movie, actors]) => {
        return res.render("moviesEdit", {
          genres,
         Movie: movie,
          actors,
          moment,
        });
      })
      .catch((error) => console.log(error));
  },
  update: function (req, res) {
    let { title, awards, rating, length, release_date, genre_id, actors } =
      req.body;

    actors = typeof actors === "string" ? [actors] : actors;

    db.Movie.update(
      {
        title: title.trim(),
        awards,
        rating,
        release_date,
        length,
        genre_id,
      },
      {
        where: {
          id: req.params.id,
        },
      }
    )
      .then(() => {
        db.Actor_Movie.destroy({
          where: {
            movie_id: req.params.id,
          },
        }).then(() => {
            if(actors){
          const actorsDB = actors.map(actor => {
            return {
              movie_id: req.params.id,
              actor_id: actor,
            };
          });
          db.Actor_Movie.bulkCreate(actorsDB, {
            validate: true,
          }).then(() => console.log("Actores agregados con exito"));
        }
        });
      })
      .catch((error) => console.log(error))
      .finally(() => res.redirect("/movies"));
  },
  delete: function (req, res) {},
  destroy: function (req, res) {
    
    db.Actor_Movie.destroy({
      where: {
        movie_id : req.params.id
      }
    })
    .then(()=>{
      db.Actor.update({
        favorite_movie_id : null
      },
      {
        where : {
          favorite_movie_id : req.params.id
        }
      })
      .then(()=>{

      })
    })

    db.Movie.destroy({
      where : {
        id : req.params.id
      }
    })
    .then(()=>{
      return res.redirect('/movies')
    })
    .catch(error => console.log(error))
  },
};

module.exports = moviesController;
