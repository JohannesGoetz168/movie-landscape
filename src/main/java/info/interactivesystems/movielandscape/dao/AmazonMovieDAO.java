package info.interactivesystems.movielandscape.dao;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import javax.ejb.Stateful;
import javax.inject.Named;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.PersistenceContextType;
import javax.persistence.Query;

@Named
@Stateful
public class AmazonMovieDAO implements Serializable {
    private static final long serialVersionUID = 1L;

    @PersistenceContext(unitName = "amazon-pu", type = PersistenceContextType.EXTENDED)
    private EntityManager em;

    public Collection<Long> getMovielensIdsAvailableAtPrime() {
	Query query = em.createNativeQuery("SELECT movielens_id FROM movielens_prime_movies ORDER BY title");
	Collection<Long> primeMovieIds = new ArrayList<Long>();
	for (Object movieId : query.getResultList()) {
	    primeMovieIds.add(convertToLong(movieId));
	}
	return primeMovieIds;
    }

    public List<Long> findMatchingMoviesByTitle(String title) {
	List<Long> results = new ArrayList<>();
	Query query = em.createNativeQuery("SELECT movielens_id FROM movielens_prime_movies WHERE title LIKE :title")
		.setParameter("title", "%" + title + "%");
	for (Object singleResult : query.getResultList()) {
	    results.add(convertToLong(singleResult));
	}
	return results;
    }

    private Long convertToLong(Object movieId) {
	return ((Number) movieId).longValue();
    }

}
