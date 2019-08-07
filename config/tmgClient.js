// create error classes
class EmptyFieldError extends Error {
  constructor (fields) {
    super (`${fields.join (', ')} fields are required but not specified`);
    this.fields = fields;
  }
}
class RequestStatusError extends Error {
  constructor (method, path, status) {
    super (`${method} ${path} returned with a status of status`);
    this.method = method;
    this.path = path;
    this.status = status;
  }
}
// create a tmg client
// let tmg = TMG ()
const TMG = () => {
  // base url
  const base = 'http://localhost:8000';
  // default options for post requests
  const postOpts = {
    method: 'post',
    credentials: 'include',
    headers: new Headers ({
      'Content-Type': 'application/json'
    })
  }
  // post shorthand
  const post = (path, body) => {
    return fetch (`${base}${path}`, {
      ...postOpts,
      body: JSON.stringify (body)
    })
  }
  // quick validation, returns array of missing fields
  const validate = (obj, fields) => {
    return fields.split (' ').filter (f => {
      return !obj [f]
    });
  }
  // object query string
  const qs = (query) => {
    if (!Object.keys (query).length) return '';
    return '?' + Object.keys (query).map (k => {return `${k}=${query [k]}`}).join ('&');
  }
  // auth section
  // async login method
  const login = async (user) => {
    // return promise
    return new Promise (async (resolve, reject) => {
      // t/c
      try {
        // client side validation, username and password are specified
        let fields = validate (user, 'username password');
        if (fields.length) throw new EmptyFieldError (fields);
        // make the request
        let response = await post ('/api/sessions', user);
        // make sure request was successful and resolve if good, otherwise throw error
        if (!response.ok) throw new RequestStatusError ('POST', '/api/sessions', response.status);
        resolve ();
      } catch (e) {
        reject (e);
      }
    });
  }
  // async sign up method
  const signup = async (user) => {
    // return promise
    return new Promise (async (resolve, reject) => {
      // t/c
      try {
        // client side validation, username email first last and password are specified
        let fields = validate (user,  'username email first last password');
        if (fields.length) throw new EmptyFieldError (fields);
        // make the request
        let response = await post ('/api/users', user);
        // make sure request was successful and resolve if good, otherwise throw error
        if (!response.ok) throw new RequestStatusError ('POST', '/api/users', response.status);
        // receive json response
        let me = await response.json ();
        resolve (me);
      } catch (e) {
        reject (e);
      }
    });
  }
  // logout
  const logout = async () => {
    // promise
    return new Promise (async (resolve, reject) => {
      try {
        let response = await fetch (`${base}/api/sessions`, {
          credentials: 'include',
          method: 'delete'
        });
        if (!response.ok) throw new RequestStatusError ('DELETE', '/api/users', response.status);
        resolve ();
      } catch (e) {
        reject (e);
      }
    });
  }
  // get logged in user information
  const me = async () => {
    // promise
    return new Promise (async (resolve, reject) => {
      //t/c
      try {
        let response = await fetch (`${base}/api/me`, {credentials: "include"});
        if (!response.ok) throw new RequestStatusError ('GET', '/api/me', response.status);
        let me = await response.json ();
        resolve (me);
      } catch (e) {
        reject (e);
      }
    })
  }
  // get a single user
  const user = async (id) => {
    // promise
    return new Promise (async (resolve, reject) => {
      //t/c
      try {
        let response = await fetch (`${base}/api/users/${id}`, {credentials: "include"});
        if (!response.ok) throw new RequestStatusError ('GET', `/api/users/${id}`, response.status);
        let data = await response.json ();
        resolve (data);
      } catch (e) {
        reject (e);
      }
    })
  }
  // get multiple users
  const users = async (query, id=false) => {
    if (id) return user (id);
    // promise
    return new Promise (async (resolve, reject) => {
      // t/c
      try {
        let response = await fetch (`${base}/api/users${qs (query)}`, {credentials: "include"});
        if (!response.ok) throw new RequestStatusError ('GET', `/api/users${qs (query)}`, response.status);
        let data = await response.json ();
        resolve (data);
      } catch (e) {
        reject (e);
      }
    })
  }
  // articles section
  // get articles
  const articles = async (query, id=false) => {
    if (id) return article (id);
    // promise
    return new Promise (async (resolve, reject) => {
      // t/c
      try {
        let response = await fetch (`${base}/api/articles${qs (query)}`, {credentials: "include"});
        if (!response.ok) throw new RequestStatusError ('GET', `/api/articles${qs (query)}`, response.status);
        let data = await response.json ();
        resolve (data);
      } catch (e) {
        reject (e);
      }
    });
  }
  // get single article
  const article = async (id) => {
    // promise
    return new Promise (async (resolve, reject) => {
      //t/c
      try {
        let response = await fetch (`${base}/api/articles/${id}`, {credentials: "include"});
        if (!response.ok) throw new RequestStatusError ('GET', `/api/articles/${id}`, response.status);
        let data = await response.json ();
        resolve (data);
      } catch (e) {
        reject (e);
      }
    });
  }
  // share an article
  const shareArticle = async (body) => {
    return new Promise (async (resolve, reject) => {
      try {
        // client side validation, title summary tags url publishedDate are specified
        let fields = validate (body,  'title summary tags url publishedDate');
        if (fields.length) throw new EmptyFieldError (fields);
        // post and resolve with article
        let response = await fetch (`${base}/api/articles`, {
          ...postOpts,
          body: JSON.stringify (body)
        });
        if (!response.ok) throw new RequestStatusError ('POST', `/api/articles`, response.status);
        let data = await response.json ();
        resolve (data);
      } catch (e) {
        reject (e);
      }
    });
  }
  // forums section
  // get forums
  const forums = async (query, id=false) => {
    if (id) return forum (id);
    // promise
    return new Promise (async (resolve, reject) => {
      // t/c
      try {
        let response = await fetch (`${base}/api/forums${qs (query)}`, {credentials: "include"});
        if (!response.ok) throw new RequestStatusError ('GET', `/api/forums${qs (query)}`, response.status);
        let data = await response.json ();
        resolve (data);
      } catch (e) {
        reject (e);
      }
    })
  }
  // get a single forum
  const forum = async (id) => {
    // promise
    return new Promise (async (resolve, reject) => {
      //t/c
      try {
        let response = await fetch (`${base}/api/forums/${id}`, {credentials: "include"});
        if (!response.ok) throw new RequestStatusError ('GET', `/api/forums/${id}`, response.status);
        let data = await response.json ();
        resolve (data);
      } catch (e) {
        reject (e);
      }
    });
  }
  // create a forum
  const createForum = (body) => {
    return new Promise (async (resolve, reject) => {
      try {
        // client side validation, title summary tags url publishedDate are specified
        let fields = validate (body,  'title description');
        if (fields.length) throw new EmptyFieldError (fields);
        // post and resolve with article
        let response = await fetch (`${base}/api/forums`, {
          ...postOpts,
          body: JSON.stringify (body)
        });
        if (!response.ok) throw new RequestStatusError ('POST', `/api/forums`, response.status);
        let data = await response.json ();
        resolve (data);
      } catch (e) {
        reject (e);
      }
    });
  }
  // comments
  const comments = async (query, id=false) => {
    if (id) return singleComment (id);
    // promise
    return new Promise (async (resolve, reject) => {
      // t/c
      try {
        let response = await fetch (`${base}/api/comments${qs (query)}`, {credentials: "include"});
        if (!response.ok) throw new RequestStatusError ('GET', `/api/comments${qs (query)}`, response.status);
        let data = await response.json ();
        resolve (data);
      } catch (e) {
        reject (e);
      }
    })
  }
  const singleComment = async (id) => {
    // promise
    return new Promise (async (resolve, reject) => {
      //t/c
      try {
        let response = await fetch (`${base}/api/comments/${id}`, {credentials: "include"});
        if (!response.ok) throw new RequestStatusError ('GET', `/api/forums/${id}`, response.status);
        let data = await response.json ();
        resolve (data);
      } catch (e) {
        reject (e);
      }
    });
  }
  const createComment = async (type, id, comment) => {
    return new Promise (async (resolve, reject) => {
      try {
        // verify type is valid
        if ('forums articles comments'.split (' ').indexOf (type) === -1) throw new Error (`Type ${type} is not valid, must be forums, articles, or comments`);
        let response = await fetch (`${base}/api/${type}/${id}/comments`, {
          ...postOpts,
          body: JSON.stringify ({comment})
        });
        if (!response.ok) throw new RequestStatusError ('/POST', `${base}/api/${type}/${id}/comments`, response.status);
        let data = await response.json ();
        resolve (data);
      } catch (e) {
        reject (e);
      }
    });
  }
  const getComments = async (type, id, query) => {
    return new Promise (async (resolve, reject) => {
      
    });
  }
  // return a tmg object
  return {
    login,
    signup,
    logout,
    me,
    users,
    articles,
    shareArticle,
    forums,
    createForum,
    createComment,

  }
}