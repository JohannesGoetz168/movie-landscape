package info.interactivesystems.movielandscape.dao;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;

import javax.ejb.Stateless;
import javax.inject.Named;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import info.interactivesystems.mapviews.mapitems.MovieMapItem;

@Named
@Stateless
public class MapItemDAO implements Serializable {
	private static final long serialVersionUID = 1L;

	private static final Logger log = LoggerFactory.getLogger(MapItemDAO.class);

	@PersistenceContext(unitName = "mapitem-pu")
	private EntityManager em;


	public Collection<MovieMapItem> getAllMapItems(String reducer) {
		log.debug("Fetching all movies for {}...", reducer);
		Collection<MovieMapItem> allMovies = new ArrayList<>();
		Query query = em.createQuery("from MovieMapItem where reducer = :reducer").setParameter("reducer", reducer);
		for (Object singleResult : query.getResultList()) {
			allMovies.add((MovieMapItem) singleResult);
		}
		log.debug("Done fetching movies. Got " + allMovies.size() + ".");
		return allMovies;
	}

}
