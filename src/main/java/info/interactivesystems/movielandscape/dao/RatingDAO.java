package info.interactivesystems.movielandscape.dao;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;

import javax.annotation.Resource;
import javax.ejb.Stateless;
import javax.inject.Named;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.sql.DataSource;

@Named
@Stateless
public class RatingDAO implements Serializable {
	private static final long serialVersionUID = 1L;
	
	@Resource(mappedName = "java:jboss/datasources/MLRatingsCustomDS", type = javax.sql.DataSource.class)
	private DataSource dataSource;

	@PersistenceContext(unitName = "rating-pu")
	private EntityManager em;
	
	public Collection<Long> getAllMovieIds() {
		Collection<Long> allMovieIds = new ArrayList<>();
		Query query = em.createNativeQuery("select distinct iid from movielens_ratings");
		for(Object iid : query.getResultList()){
			allMovieIds.add(((Number) iid).longValue());
		}
		return allMovieIds;
	}

	public int countRatingsForMovie(long movielensId){
		Query query = em.createNativeQuery("SELECT COUNT(*) FROM movielens_ratings WHERE iid = :movieId").setParameter("movieId", movielensId); 	
		return ((Number) query.getSingleResult()).intValue();
	}

	public DataSource getDataSource() {
		return dataSource;
	}

}
