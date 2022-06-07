package info.interactivesystems.movielandscape.dao;

import java.util.List;

import javax.ejb.Stateful;
import javax.inject.Named;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.PersistenceContextType;
import javax.persistence.Query;

import info.interactivesystems.movielandscape.entities.Account;

@Named
@Stateful
public class AccountDAO {

	@PersistenceContext(unitName = "movielandscape-pu", type = PersistenceContextType.EXTENDED)
	private EntityManager em;

	public Account getAccountByLoginName(String loginName) {
		Query query = em.createQuery("from Account where loginName = :loginName", Account.class)
				.setParameter("loginName", loginName);
		List<Account> results = query.getResultList();
		if (results == null || results.isEmpty()) {
			return null;
		}
		return results.get(0);
	}

	public Account findAccount(long id) {
		return em.find(Account.class, id);
	}

	public void saveAccount(Account account) {
		em.persist(account);
	}

}
