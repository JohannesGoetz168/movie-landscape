package info.interactivesystems.movielandscape.recommender;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import org.apache.mahout.cf.taste.common.TasteException;
import org.apache.mahout.cf.taste.impl.recommender.svd.Factorization;
import org.apache.mahout.cf.taste.impl.recommender.svd.Factorizer;
import org.apache.mahout.cf.taste.impl.recommender.svd.FilePersistenceStrategy;
import org.apache.mahout.cf.taste.impl.recommender.svd.ParallelSGDFactorizer;
import org.apache.mahout.cf.taste.impl.recommender.svd.PersistenceStrategy;
import org.apache.mahout.cf.taste.model.DataModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import info.interactivesystems.mapviews.commons.util.FileUtil;
import info.interactivesystems.mapviews.commons.util.MathUtils;

public class OnlineRecommender {
	private static final Logger log = LoggerFactory.getLogger(OnlineRecommender.class);

	private static final int NUM_FEATURES = 20;
	private static final double LAMBDA = 0.01;
	private static final int NUM_EPOCHS = 30;

	protected static final int USER_BIAS_INDEX = 1;
	protected static final int ITEM_BIAS_INDEX = 2;
	protected static final int FEATURE_OFFSET = 3;

	private Factorization factorization;
	private PersistenceStrategy persistenceStrategy;

	public OnlineRecommender(DataModel dataModel) {
		log.info("Trying to load factorization from file...");
		persistenceStrategy = new FilePersistenceStrategy(new File(FileUtil.createTempDirectory("interactive-systems")
				+ "model_" + ParallelSGDFactorizer.class.getSimpleName() + NUM_FEATURES + "-" + LAMBDA + "-"
				+ NUM_EPOCHS + ".dat"));
		try {
			factorization = persistenceStrategy.load();
		} catch (IOException e1) {
			log.warn("Cannot load factorization.", e1);
		}
		if (factorization == null) {
			log.info("No persistent factorization found. Calculating from scratch...");
			try {
				Factorizer factorizer = new ParallelSGDFactorizer(dataModel, NUM_FEATURES, LAMBDA, NUM_EPOCHS);
				factorization = factorizer.factorize();
				persistenceStrategy.maybePersist(factorization);
			} catch (TasteException | IOException e) {
				log.error("Cannot create factorization.", e);
			}
		}
	}

	public double[] computeUserVector(Map<Long, Double> userPreferences) {

		double[][] Q = getItemFeaturesWithoutOffset();
		double[] x = getPreferencesWithoutOffset(userPreferences);
		double[] newUserVector = MathUtils.lsolve(Q, x);
		double[] newUserVectorWithOffset = new double[newUserVector.length + FEATURE_OFFSET];
		newUserVectorWithOffset[0] = factorization.allUserFeatures()[0][0];
		newUserVectorWithOffset[USER_BIAS_INDEX] = 0;
		newUserVectorWithOffset[ITEM_BIAS_INDEX] = 1;
		for (int i = 0; i < newUserVector.length; i++) {
			newUserVectorWithOffset[FEATURE_OFFSET + i] = newUserVector[i];
		}
		return newUserVectorWithOffset;
	}

	private double[][] getItemFeaturesWithoutOffset() {
		double[][] itemFeaturesWithoutOffset = new double[factorization.allItemFeatures().length][NUM_FEATURES];
		for (int i = 0; i < factorization.allItemFeatures().length; i++) {
			double[] itemFeatures = factorization.allItemFeatures()[i];
			itemFeaturesWithoutOffset[i] = Arrays.copyOfRange(itemFeatures, FEATURE_OFFSET,
					NUM_FEATURES + FEATURE_OFFSET);
		}

		return itemFeaturesWithoutOffset;
	}

	private double[] getPreferencesWithoutOffset(Map<Long, Double> preferences) {
		double[] preferencesWithoutOffset = new double[preferences.size()];
		for (Entry<Long, Integer> entry : factorization.getItemIDMappings()) {
			long itemId = entry.getKey();
			int itemIndex = entry.getValue();
			double preferenceWithoutOffset = preferences.get(itemId);
			double globalAvg = factorization.allUserFeatures()[0][0];
			preferenceWithoutOffset -= globalAvg;
			preferenceWithoutOffset -= factorization.allItemFeatures()[itemIndex][ITEM_BIAS_INDEX];
			preferencesWithoutOffset[itemIndex] = preferenceWithoutOffset;
		}
		return preferencesWithoutOffset;
	}

	public Map<Long, Double> estimatePreferences(double[] featureVector) {
		Map<Long, Double> preferences = new HashMap<Long, Double>();

		for (Entry<Long, Integer> entry : factorization.getItemIDMappings()) {
			long itemId = entry.getKey();
			preferences.put(itemId, 0d);
			try {
				double preference = estimatePreference(featureVector, itemId);
				if (!Double.isNaN(preference) && preference > 0) {
					preferences.put(itemId, preference);
				}
			} catch (TasteException e) {
				log.debug("Cannot calculate preference for item {}. {}", itemId, e.getStackTrace());
			}
		}
		return preferences;
	}

	private double estimatePreference(double[] userFeatures, long itemID) throws TasteException {
		double[] itemFeatures = factorization.getItemFeatures(itemID);
		return MathUtils.calculateDotProduct(userFeatures, itemFeatures);
	}
}
