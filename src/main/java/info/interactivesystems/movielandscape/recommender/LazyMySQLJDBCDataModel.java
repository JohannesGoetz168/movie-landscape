package info.interactivesystems.movielandscape.recommender;

import java.util.Collection;

import javax.sql.DataSource;

import org.apache.mahout.cf.taste.common.Refreshable;
import org.apache.mahout.cf.taste.common.TasteException;
import org.apache.mahout.cf.taste.impl.common.FastIDSet;
import org.apache.mahout.cf.taste.impl.common.LongPrimitiveIterator;
import org.apache.mahout.cf.taste.impl.model.jdbc.MySQLJDBCDataModel;
import org.apache.mahout.cf.taste.impl.model.jdbc.ReloadFromJDBCDataModel;
import org.apache.mahout.cf.taste.model.DataModel;
import org.apache.mahout.cf.taste.model.PreferenceArray;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LazyMySQLJDBCDataModel implements DataModel {
	private static final long serialVersionUID = 1L;
	private static final Logger LOGGER = LoggerFactory.getLogger(LazyMySQLJDBCDataModel.class);
	
	private DataSource dataSource;
	private String preferenceTable;
	private String userIDColumn;
	private String itemIDColumn;
	private String preferenceColumn;
	private String timestampColumn;
	
	private DataModel dataModel;
	
	public LazyMySQLJDBCDataModel(DataSource dataSource, String preferenceTable, String userIDColumn,
			String itemIDColumn, String preferenceColumn, String timestampColumn) {
		this.dataSource = dataSource;
		this.preferenceTable = preferenceTable;
		this.userIDColumn = userIDColumn;
		this.itemIDColumn = itemIDColumn;
		this.preferenceColumn = preferenceColumn;
		this.timestampColumn = timestampColumn;
	}
	
	private DataModel getDataModel() {
		if(dataModel == null) {
			try {
				dataModel = new ReloadFromJDBCDataModel(new MySQLJDBCDataModel(dataSource, preferenceTable, userIDColumn, itemIDColumn, preferenceColumn, timestampColumn));
			} catch (TasteException e) {
				LOGGER.error("Cannot create DataModel from DB.", e);
			}
		}
		return dataModel;
	}

	@Override
	public void refresh(Collection<Refreshable> alreadyRefreshed) {
		getDataModel().refresh(alreadyRefreshed);		
	}

	@Override
	public LongPrimitiveIterator getUserIDs() throws TasteException {
		return getDataModel().getUserIDs();
	}

	@Override
	public PreferenceArray getPreferencesFromUser(long userID) throws TasteException {
		return getDataModel().getPreferencesFromUser(userID);
	}

	@Override
	public FastIDSet getItemIDsFromUser(long userID) throws TasteException {
		return getDataModel().getItemIDsFromUser(userID);
	}

	@Override
	public LongPrimitiveIterator getItemIDs() throws TasteException {
		return getDataModel().getItemIDs();
	}

	@Override
	public PreferenceArray getPreferencesForItem(long itemID) throws TasteException {
		return getDataModel().getPreferencesForItem(itemID);
	}

	@Override
	public Float getPreferenceValue(long userID, long itemID) throws TasteException {
		return getDataModel().getPreferenceValue(userID, itemID);
	}

	@Override
	public Long getPreferenceTime(long userID, long itemID) throws TasteException {
		return getDataModel().getPreferenceTime(userID, itemID);
	}

	@Override
	public int getNumItems() throws TasteException {
		return getDataModel().getNumItems();
	}

	@Override
	public int getNumUsers() throws TasteException {
		return getDataModel().getNumUsers();
	}

	@Override
	public int getNumUsersWithPreferenceFor(long itemID) throws TasteException {
		return getDataModel().getNumUsersWithPreferenceFor(itemID);
	}

	@Override
	public int getNumUsersWithPreferenceFor(long itemID1, long itemID2) throws TasteException {
		return getDataModel().getNumUsersWithPreferenceFor(itemID1, itemID2);
	}

	@Override
	public void setPreference(long userID, long itemID, float value) throws TasteException {
		getDataModel().setPreference(userID, itemID, value);
	}

	@Override
	public void removePreference(long userID, long itemID) throws TasteException {
		getDataModel().removePreference(userID, itemID);
	}

	@Override
	public boolean hasPreferenceValues() {
		return getDataModel().hasPreferenceValues();
	}

	@Override
	public float getMaxPreference() {
		return getDataModel().getMaxPreference();
	}

	@Override
	public float getMinPreference() {
		return getDataModel().getMinPreference();
	}	
}
