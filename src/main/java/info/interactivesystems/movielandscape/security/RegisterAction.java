package info.interactivesystems.movielandscape.security;

import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.inject.Named;

import info.interactivesystems.movielandscape.UserBean;
import info.interactivesystems.movielandscape.dao.AccountDAO;
import info.interactivesystems.movielandscape.entities.Account;
import info.interactivesystems.movielandscape.entities.User;
import info.interactivesystems.movielandscape.utils.FacesUtils;

@Named
@RequestScoped
public class RegisterAction {
    
    private String userName;
    private String email;
    private String password;
    
    @Inject 
    private AccountDAO accountDao;
    
    @Inject
    private UserBean userBean;
    
    public void register() {
	if(validateInput()) {
	    Account account = new Account();
	    account.setLoginName(userName);
	    account.setEmail(email);
	    
	    byte[] salt = SecurityUtils.getSalt();
	    account.setSalt(salt);
	    String encryptedPassword = SecurityUtils.getSecurePassword(password, salt);
	    account.setPassword(encryptedPassword);
	    account.setUser(new User());
	    
	    accountDao.saveAccount(account);
	    userBean.login(account.getId());
	}
    }

    private boolean validateInput() {
	if(accountDao.getAccountByLoginName(userName) != null) {
	    FacesUtils.growlError("Username is already taken. Please try another one.");
	    return false;
	}
	return true;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
    
}
