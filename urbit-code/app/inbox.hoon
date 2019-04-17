/+  *server, collections

/=  index
  /^  octs
  /;  as-octs:mimes:html
  /:  /===/app/inbox/index
  /|  /html/
      /~  ~
  ==
/=  script
  /^  octs
  /;  as-octs:mimes:html
  /:  /===/app/inbox/js/index
  /|  /js/
      /~  ~
  ==
/=  style
  /^  octs
  /;  as-octs:mimes:html
  /:  /===/app/inbox/css/index
  /|  /css/
      /~  ~
  ==
::
|%
::
+$  move  [bone card]
::
+$  card
  $%  [%http-response =http-event:http]
      [%connect wire binding:http-server term]
      [%peer wire dock path]
      [%quit ~]
  ==
::
--
::
|_  [bol=bowl:gall ~]
::
++  this  .
::
++  prep
  |=  old=(unit ~)
  ^-  (quip move _this)
  ~&  'connect'
  ?~  old
    :_  this
    [ost.bol %connect / [~ /'~inbox'] %inbox]~
  [~ this]
::
++  bound
  |=  [wir=wire success=? binding=binding:http-server]
  ^-  (quip move _this)
  [~ this]
::
::
++  poke-handle-http-request
  %-  (require-authorization:app ost.bol move this)
  |=  =inbound-request:http-server
  ^-  (quip move _this)
  ::
  =+  request-line=(parse-request-line url.request.inbound-request)
  ~&  site.request-line
  ?+  site.request-line
    :_  this
    [ost.bol %http-response not-found:app]~
  ::
  ::  inbox page
  ::
      [%'~inbox' ~]
    :_  this
    [ost.bol %http-response (html-response:app index)]~
  ::
  ::  styling
  ::
      [%'~inbox' %css %index ~]
    :_  this
    [ost.bol %http-response (css-response:app style)]~
  ::
  ::  javascript
  ::
      [%'~inbox' %js %index ~]
    :_  this
    [ost.bol %http-response (js-response:app script)]~
  ==
::
--
