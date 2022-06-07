package info.interactivesystems.movielandscape;

import java.io.Serializable;
import java.text.SimpleDateFormat;
import java.util.Date;

import javax.annotation.PostConstruct;
import javax.enterprise.context.SessionScoped;
import javax.inject.Inject;
import javax.inject.Named;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import info.interactivesystems.movielandscape.dao.AccountDAO;
import info.interactivesystems.movielandscape.entities.Account;
import info.interactivesystems.movielandscape.entities.Configuration;
import info.interactivesystems.movielandscape.entities.User;

@Named
@SessionScoped
public class UserBean implements Serializable {
	private static final long serialVersionUID = 13L;
	private static final Logger logger = LoggerFactory.getLogger(UserBean.class);
	private static final String DEFAULT_USERNAME = "AnonymousUser";

	private Account account;
	private User user;

	private boolean loggedIn;

	private boolean showLogin;

	@Inject
	private AccountDAO accountDao;

	@Inject
	private RecommendationBean recommendationBean;

	@PostConstruct
	public void init() {
		loggedIn = false;
		showLogin = true;
		setDefaultAccount();
	}

	private void setDefaultAccount() {
		account = new Account();
		account.setLoginName(DEFAULT_USERNAME);
		user = new User();
		user.setConfiguration(new Configuration());
	}

	public boolean isLoggedIn() {
		return loggedIn;
	}

	public void login(long id) {
		account = accountDao.findAccount(id);
		logger.info("User logged in: {}.", account.getLoginName());
		Configuration oldConfiguration = user.getConfiguration();
		user = account.getUser();
		updateConfiguration(oldConfiguration);
		user.getStatistics().addLogin(new Date());
		accountDao.saveAccount(account);
		loggedIn = true;
	}

	private void updateConfiguration(Configuration oldConfiguration) {
		Configuration newConfiguration = user.getConfiguration();
		newConfiguration.addAllBlockedMovies(oldConfiguration.getBlockedMovielensIds());
		recommendationBean.calculateRecommendations();
	}

	public void addItemToBlockList(long movielensId) {
		logger.debug("Add item to block list: {}", movielensId);
		user.getConfiguration().addBlockedMovie(movielensId);
		accountDao.saveAccount(account);
		recommendationBean.calculateRecommendations();
	}

	public void removeItemFromBlockList(long movielensId) {
		logger.debug("Remove item from block list: {}", movielensId);
		user.getConfiguration().removeBlockedMovie(movielensId);
		accountDao.saveAccount(account);
		recommendationBean.calculateRecommendations();

	}

	public void logout() {
		setDefaultAccount();
		loggedIn = false;
		recommendationBean.calculateRecommendations();
	}

	public String getLastLogin() {
		SimpleDateFormat simpleDateformat = new SimpleDateFormat("dd. MMM yyyy");
		return simpleDateformat.format(user.getStatistics().getLastLogin());
	}

	public void setSculptAmount(String sculptAmountString) {
		if (sculptAmountString != null) {
			try {
				double sculptAmount = Double.parseDouble(sculptAmountString);
				user.getConfiguration().setSculptAmount(sculptAmount);
				accountDao.saveAccount(account);
			} catch (NumberFormatException e) {
				logger.warn("Parse error while parsing \"{}\"", sculptAmountString);
			}
		}
	}

	public String getSculptAmount() {
		return String.valueOf(user.getConfiguration().getSculptAmount());
	}

	public void setSculptPatchSize(String sculptPatchSizeString) {
		if (sculptPatchSizeString != null) {
			try {
				double sculptPatchSize = Double.parseDouble(sculptPatchSizeString);
				user.getConfiguration().setSculptPatchSize(sculptPatchSize);
				accountDao.saveAccount(account);
			} catch (NumberFormatException e) {
				logger.warn("Parse error while parsing \"{}\"", sculptPatchSizeString);
			}
		}
	}

	public String getSculptPatchSize() {
		return String.valueOf(user.getConfiguration().getSculptPatchSize());
	}

	public Account getAccount() {
		return account;
	}

	public User getUser() {
		return user;
	}

	public boolean isShowLogin() {
		return showLogin;
	}

	public void setShowLogin(boolean showLogin) {
		this.showLogin = showLogin;
	}
}
