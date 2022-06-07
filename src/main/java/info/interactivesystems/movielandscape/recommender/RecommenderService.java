package info.interactivesystems.movielandscape.recommender;

import javax.annotation.PostConstruct;
import javax.ejb.Singleton;
import javax.ejb.Startup;
import javax.inject.Inject;
import javax.inject.Named;

import org.apache.mahout.cf.taste.common.TasteException;
import org.apache.mahout.cf.taste.impl.model.jdbc.ConnectionPoolDataSource;
import org.apache.mahout.cf.taste.model.DataModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import info.interactivesystems.movielandscape.dao.RatingDAO;

@Named
@Startup
@Singleton
public class RecommenderService {
	private static final Logger logger = LoggerFactory.getLogger(RecommenderService.class);

	private DataModel dataModel;

	private OnlineRecommender recommender;
	
	@Inject
	private RatingDAO ratingDAO;

	@PostConstruct
	public void initRecommender() {
		dataModel = createDataModelFromDb();
		recommender = new OnlineRecommender(dataModel);
	}

	private DataModel createDataModelFromDb() {
		logger.info("Start building mahout datamodel form database...");
		    return new LazyMySQLJDBCDataModel(new ConnectionPoolDataSource(ratingDAO.getDataSource()), "movielens_ratings",
				    "uid", "iid", "rating", null);
	    }


	@Deprecated
	public int getRatingCountForMovie(long movielensId) {
		try {
			return dataModel.getPreferencesForItem(movielensId).length();
		} catch (TasteException e) {
			logger.warn("Cannot find movie with id {} in rating data model.", movielensId);
			return 0;
		}
	}

	public OnlineRecommender getRecommender() {
		return recommender;
	}

}
