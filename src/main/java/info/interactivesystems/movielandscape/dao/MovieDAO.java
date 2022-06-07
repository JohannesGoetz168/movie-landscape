package info.interactivesystems.movielandscape.dao;

import java.io.Serializable;

import javax.ejb.Stateful;
import javax.inject.Named;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.PersistenceContextType;

import info.interactivesystems.movielensmetadata.commons.Movie;

@Named
@Stateful
public class MovieDAO implements Serializable {
	private static final long serialVersionUID = 1L;

	@PersistenceContext(unitName = "movie-pu", type = PersistenceContextType.EXTENDED)
	private EntityManager em;

	public Movie findMovie(long id) {
		return em.find(Movie.class, id);
	}

}
