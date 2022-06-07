package info.interactivesystems.movielandscape.security;

import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.inject.Named;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import info.interactivesystems.movielandscape.UserBean;
import info.interactivesystems.movielandscape.dao.AccountDAO;
import info.interactivesystems.movielandscape.entities.Account;
import info.interactivesystems.movielandscape.utils.FacesUtils;

@Named
@RequestScoped
public class LoginAction {
    private static final Logger logger = LoggerFactory.getLogger(LoginAction.class);
    
    private String loginName;
    private String password;
    
    @Inject
    private AccountDAO accountDao;
    
    @Inject
    private UserBean userBean;
    
    public void login() {
	Account foundAccount = accountDao.getAccountByLoginName(loginName);
	if(foundAccount != null) {
	    String encryptedPW = SecurityUtils.getSecurePassword(password, foundAccount.getSalt());
	    if(foundAccount.getPassword().equals(encryptedPW)) {
		userBean.login(foundAccount.getId());
		return;
	    } else {
		logger.debug("Password for login attempt by user {} is incorrect", loginName);
	    }
	} else {
	    logger.debug("No such username: {}", loginName);
	}
	FacesUtils.growlError("Login name or password is incorrect.");
    }

    public String getLoginName() {
        return loginName;
    }

    public void setLoginName(String loginName) {
        this.loginName = loginName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

}
