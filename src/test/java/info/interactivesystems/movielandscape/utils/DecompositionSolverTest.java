package info.interactivesystems.movielandscape.utils;

import java.io.File;
import java.io.IOException;
import java.util.Map.Entry;

import org.apache.commons.math3.linear.Array2DRowRealMatrix;
import org.apache.commons.math3.linear.ArrayRealVector;
import org.apache.commons.math3.linear.DecompositionSolver;
import org.apache.commons.math3.linear.SingularValueDecomposition;
import org.apache.mahout.cf.taste.common.NoSuchItemException;
import org.apache.mahout.cf.taste.common.NoSuchUserException;
import org.apache.mahout.cf.taste.common.TasteException;
import org.apache.mahout.cf.taste.impl.model.file.FileDataModel;
import org.apache.mahout.cf.taste.impl.recommender.svd.Factorization;
import org.apache.mahout.cf.taste.impl.recommender.svd.Factorizer;
import org.apache.mahout.cf.taste.impl.recommender.svd.ParallelSGDFactorizer;
import org.apache.mahout.cf.taste.impl.recommender.svd.PersistenceStrategy;
import org.apache.mahout.cf.taste.impl.recommender.svd.SVDRecommender;
import org.apache.mahout.cf.taste.model.DataModel;
import org.apache.mahout.cf.taste.recommender.Recommender;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.internal.ArrayComparisonFailure;

public class DecompositionSolverTest {

	private DataModel dataModel;

	private Factorizer factorizer;
	
	private Factorization factorization;
	
	private Recommender recommender;
	
	private static DecompositionSolver decompositionSolver;

	@Before
	public void setUp() {
		try {
			dataModel = new FileDataModel(new File(this.getClass().getResource("/ratings_1m.dat").getPath()), "::");
			factorizer = new ParallelSGDFactorizer(dataModel, 8, 0.01, 16);
			
			recommender = new SVDRecommender(dataModel, factorizer, new PersistenceStrategy() {
				
				@Override
				public void maybePersist(Factorization newFactorization) throws IOException {
					factorization = newFactorization;
				}
				
				@Override
				public Factorization load() throws IOException {
					return factorization;
				}
			});
			Assert.assertNotNull("Recommender is null.", recommender);
			Assert.assertNotNull("Factorization is null.", factorization);
			
		} catch (TasteException | IOException e) {
			throw new RuntimeException(e);
		}
	}
	
	@Test
	public void testLsolve(){
			testSimpleEquationSystems();
			
			testFactorization();
	}
	
	private void testSimpleEquationSystems() throws ArrayComparisonFailure {
		double[] resultQuadratic = solve(new double [][] { {2, 3, -2 }, { -1, 7, 6 }, { 4, -3, -5 }}, new double[] {1, -2, 1});
		Assert.assertArrayEquals("Solver does not solve the equation system correctly. [Quadratic matrix]", new double[]{-0.3698630137, 0.1780821918, -0.602739726}, resultQuadratic,  1E-10);
		decompositionSolver = null;
		
		double[] resultOverdetermined =solve(new double[][] { {2, 7}, {6, 3}, {4, 9}}, new double[] {2, 1, 4});
		Assert.assertArrayEquals("Solver does not solve the equation system correctly. [Overdetermined]", new double[]{0.00316455696, 0.37974683544}, resultOverdetermined, 1E-10);
		decompositionSolver = null;
	}
	
	private double[] solve(double[][]A, double[] b){
	    if(decompositionSolver == null){
		decompositionSolver = new SingularValueDecomposition(new Array2DRowRealMatrix(A)).getSolver();
	    }
	    return decompositionSolver.solve(new ArrayRealVector(b)).toArray();
	}
	
	private void testFactorization() throws ArrayComparisonFailure {
		
		double[][] Q = getItemFeatures(factorization);
		
		double globalDiff = 0;
		
		for(Entry<Long, Integer> userIdMapping : factorization.getUserIDMappings()){
			try {
				double[] automaticallyEstimatedRatings = automaticallyEstimateRatings(factorization, recommender, userIdMapping);
				
				double[] originalUserFeatures = factorization.getUserFeatures(userIdMapping.getKey());
				double[] calculatedUserFeatures = solve(Q, automaticallyEstimatedRatings);
				
				double[] manuallyEstimatedRatings = manuallyEstimateRatings(calculatedUserFeatures, factorization);
				
				Assert.assertArrayEquals("Predictions are not equal.",  automaticallyEstimatedRatings, manuallyEstimatedRatings, 1E-6);
				
				double diff = 0;
				for(int i = 0; i < originalUserFeatures.length; i++){
					diff += Math.abs(originalUserFeatures[i] - calculatedUserFeatures[i]);
				}
				globalDiff += diff / originalUserFeatures.length;
			} catch (NoSuchUserException e) {
				throw new RuntimeException(e);
			}
		}
		globalDiff /= factorization.numUsers();
		System.out.println("Global diff: " + globalDiff);
	}

	private double[] automaticallyEstimateRatings(Factorization factorization, Recommender recommender, Entry<Long, Integer> userIdMapping) {
		double[] predictedRatings = new double[getItemFeatures(factorization).length];
		for(Entry<Long, Integer> itemIdMapping : factorization.getItemIDMappings()){
			try {
				predictedRatings[itemIdMapping.getValue()] = recommender.estimatePreference(userIdMapping.getKey(), itemIdMapping.getKey());
			} catch (TasteException e) {
				throw new RuntimeException(e);
			}
		}
		return predictedRatings;
	}

	private double[] manuallyEstimateRatings(double[] userFeatures, Factorization factorization) {
		double[] estimatedPreferences = new double[factorization.numItems()];
		for(Entry<Long, Integer> itemIdMapping : factorization.getItemIDMappings()){
			double[] itemFeatures;
			try {
				itemFeatures = factorization.getItemFeatures(itemIdMapping.getKey());
				double estimation = 0;
				for(int i = 0; i < factorization.numFeatures(); i++){
					estimation += userFeatures[i] * itemFeatures[i];
				}
				estimatedPreferences[itemIdMapping.getValue()] = estimation;
			} catch (NoSuchItemException e) {
				throw new RuntimeException(e);
			}
		}
		return estimatedPreferences;
	}

	private double[][] getItemFeatures(Factorization factorization) {
		double[][] itemFeatures = new double[factorization.allItemFeatures().length][factorization.numFeatures()];
		for(Entry<Long, Integer> itemIdMapping : factorization.getItemIDMappings()){
			try {
				itemFeatures[itemIdMapping.getValue()] = factorization.getItemFeatures(itemIdMapping.getKey());
			} catch (NoSuchItemException e) {
				throw new RuntimeException(e);
			}
		}
		return itemFeatures;
	}

}
