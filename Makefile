PORT    ?= 8080
RUNTIME := .runtime
PIDFILE := $(RUNTIME)/server.pid
LOGFILE := $(RUNTIME)/server.log
# for `make deploy`: make deploy CS_USER=c23abc [PROJECT=namn]
CS_USER ?=
PROJECT ?= presentation
HOST    ?= itchy.cs.umu.se

.PHONY: help up down status test deploy

help:  ## Visa den här hjälpen
	@echo "Tillgängliga kommandon:"
	@echo
	@grep -E '^[a-z]+:.*## ' $(MAKEFILE_LIST) | sed -E 's/^([a-z]+):.*## (.*)/  make \1\t\2/' | expand -t 16

up:  ## Starta presentationen lokalt
	@command -v python3 >/dev/null || { echo "python3 krävs för den lokala servern. Installera det och kör make up igen."; exit 1; }
	@mkdir -p $(RUNTIME)
	@if [ -f $(PIDFILE) ] && kill -0 $$(cat $(PIDFILE)) 2>/dev/null; then \
		echo "Servern kör redan: http://127.0.0.1:$(PORT)/"; \
	else \
		nohup python3 -m http.server $(PORT) --bind 127.0.0.1 --directory . >$(LOGFILE) 2>&1 & echo $$! >$(PIDFILE); \
		sleep 0.5; \
		if kill -0 $$(cat $(PIDFILE)) 2>/dev/null; then \
			echo "Klart! Öppna http://127.0.0.1:$(PORT)/"; echo; echo "Kör \`make help\` för fler kommandon."; \
		else \
			echo "Servern startade inte, se $(LOGFILE):"; cat $(LOGFILE); rm -f $(PIDFILE); exit 1; \
		fi; \
	fi

down:  ## Stoppa den lokala servern
	@if [ -f $(PIDFILE) ] && kill -0 $$(cat $(PIDFILE)) 2>/dev/null; then \
		kill $$(cat $(PIDFILE)) && echo "Servern stoppad."; \
	else \
		echo "Servern kör inte."; \
	fi
	@rm -f $(PIDFILE)

status:  ## Visa om servern kör
	@if [ -f $(PIDFILE) ] && kill -0 $$(cat $(PIDFILE)) 2>/dev/null; then \
		echo "Kör på http://127.0.0.1:$(PORT)/ (pid $$(cat $(PIDFILE)))"; \
	else \
		echo "Servern kör inte."; \
	fi

test:  ## Kolla JavaScript-syntax och relativa länkar
	@if command -v node >/dev/null; then node --check assets/app.js && echo "assets/app.js: syntax ok"; else echo "node saknas, hoppar över syntaxkoll"; fi
	@if grep -nE '(src|href)="/[^/]' index.html; then echo "Fel: rotabsoluta länkar ovan går sönder under ~/public_html/<projekt>/"; exit 1; fi
	@for f in $$(grep -oE '(src|href)="assets/[^"]+"' index.html | sed -E 's/.*="([^"]+)"/\1/'); do \
		[ -f "$$f" ] || { echo "Saknas: $$f"; exit 1; }; \
	done; echo "länkar: ok"

deploy:  ## Kopiera till ~/public_html på itchy
	@[ -n "$(CS_USER)" ] || { echo "Ange ditt CS-användarnamn: make deploy CS_USER=c23abc"; exit 1; }
	rsync -av --delete --exclude .git --exclude $(RUNTIME) --exclude guidelines \
		./ $(CS_USER)@$(HOST):public_html/$(PROJECT)/
	@echo
	@echo "Live på https://people.cs.umu.se/$(CS_USER)/$(PROJECT)/"
