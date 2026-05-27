[
  {
    "source": {
      "level": "info",
      "message": "2026-05-27T10:55:09.525Z"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:55:09.527Z",
    "$workers": {
      "truncated": false,
      "event": {
        "scheduledTime": "2026-05-27T10:55:09.525Z"
      },
      "scriptName": "clip-relay",
      "outcome": "ok",
      "eventType": "alarm",
      "entrypoint": "Room",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "executionModel": "durableObject",
      "durableObjectId": "93554d8bbc991051c6d05232880f06b731250313388f4979300c30d8d6a46d8a",
      "requestId": "5CN8F3R851PPBOIR",
      "wallTimeMs": 14,
      "cpuTimeMs": 0
    },
    "$metadata": {
      "id": "01KSMH5W6QSFSPTDKQKZ4RD9Y6",
      "requestId": "5CN8F3R851PPBOIR",
      "trigger": "2026-05-27T10:55:09.525Z",
      "service": "clip-relay",
      "level": "info",
      "message": "2026-05-27T10:55:09.525Z",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker-event",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "alarm",
      "messageTemplate": "<DATETIME>"
    }
  },
  {
    "source": {
      "message": "WebSocket upgrade complete, returning 101"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:55:09.525Z",
    "$workers": {
      "truncated": false,
      "event": {
        "request": {
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        }
      },
      "outcome": "canceled",
      "scriptName": "clip-relay",
      "eventType": "fetch",
      "executionModel": "durableObject",
      "durableObjectId": "93554d8bbc991051c6d05232880f06b731250313388f4979300c30d8d6a46d8a",
      "entrypoint": "Room",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247c4fae77c6bb"
    },
    "$metadata": {
      "id": "01KSMH60WMQ7NVF2QZAGTG4WAM",
      "requestId": "a0247c4fae77c6bb",
      "trigger": "GET /",
      "service": "clip-relay",
      "message": "WebSocket upgrade complete, returning 101",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "WebSocket upgrade complete, returning 101"
    }
  },
  {
    "source": {
      "message": "Accepted WebSocket, total: 2"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:55:09.405Z",
    "$workers": {
      "truncated": false,
      "event": {
        "request": {
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        }
      },
      "outcome": "canceled",
      "scriptName": "clip-relay",
      "eventType": "fetch",
      "executionModel": "durableObject",
      "durableObjectId": "93554d8bbc991051c6d05232880f06b731250313388f4979300c30d8d6a46d8a",
      "entrypoint": "Room",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247c4fae77c6bb"
    },
    "$metadata": {
      "id": "01KSMH60WMQ7NVF2QZAGTG4WAK",
      "requestId": "a0247c4fae77c6bb",
      "trigger": "GET /",
      "service": "clip-relay",
      "message": "Accepted WebSocket, total: 2",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "Accepted WebSocket, total: 2"
    }
  },
  {
    "source": {
      "message": "Created WebSocketPair"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:55:09.405Z",
    "$workers": {
      "truncated": false,
      "event": {
        "request": {
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        }
      },
      "outcome": "canceled",
      "scriptName": "clip-relay",
      "eventType": "fetch",
      "executionModel": "durableObject",
      "durableObjectId": "93554d8bbc991051c6d05232880f06b731250313388f4979300c30d8d6a46d8a",
      "entrypoint": "Room",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247c4fae77c6bb"
    },
    "$metadata": {
      "id": "01KSMH60WMQ7NVF2QZAGTG4WAJ",
      "requestId": "a0247c4fae77c6bb",
      "trigger": "GET /",
      "service": "clip-relay",
      "message": "Created WebSocketPair",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "Created WebSocketPair"
    }
  },
  {
    "source": {
      "message": "WebSocket request, token: fsadfa-yjg5bf86vu3b"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:55:09.405Z",
    "$workers": {
      "truncated": false,
      "event": {
        "request": {
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        }
      },
      "outcome": "canceled",
      "scriptName": "clip-relay",
      "eventType": "fetch",
      "executionModel": "durableObject",
      "durableObjectId": "93554d8bbc991051c6d05232880f06b731250313388f4979300c30d8d6a46d8a",
      "entrypoint": "Room",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247c4fae77c6bb"
    },
    "$metadata": {
      "id": "01KSMH60WMQ7NVF2QZAGTG4WAH",
      "requestId": "a0247c4fae77c6bb",
      "trigger": "GET /",
      "service": "clip-relay",
      "message": "WebSocket request, token: fsadfa-yjg5bf86vu3b",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "WebSocket request, token: fsadfa-yjg5bf86vu3b"
    }
  },
  {
    "source": {
      "message": "Room.fetch called, path: / upgrade: websocket"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:55:09.405Z",
    "$workers": {
      "truncated": false,
      "event": {
        "request": {
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        }
      },
      "outcome": "canceled",
      "scriptName": "clip-relay",
      "eventType": "fetch",
      "executionModel": "durableObject",
      "durableObjectId": "93554d8bbc991051c6d05232880f06b731250313388f4979300c30d8d6a46d8a",
      "entrypoint": "Room",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247c4fae77c6bb"
    },
    "$metadata": {
      "id": "01KSMH60WMQ7NVF2QZAGTG4WAG",
      "requestId": "a0247c4fae77c6bb",
      "trigger": "GET /",
      "service": "clip-relay",
      "message": "Room.fetch called, path: / upgrade: websocket",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "<DOMAIN> called, path: / upgrade: websocket"
    }
  },
  {
    "source": {
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:55:08.759Z",
    "$workers": {
      "event": {
        "request": {
          "cf": {
            "isEUCountry": false,
            "httpProtocol": "HTTP/1.1",
            "tlsCipher": "AEAD-AES128-GCM-SHA256",
            "continent": "NA",
            "clientAcceptEncoding": "gzip, deflate, br",
            "verifiedBotCategory": "",
            "country": "US",
            "region": "California",
            "tlsClientCiphersSha1": "TkWWX+BVdX+teLUyccOBfetwATE=",
            "tlsClientAuth": {
              "certIssuerDNLegacy": "",
              "certIssuerSKI": "",
              "certSubjectDNRFC2253": "",
              "certSubjectDNLegacy": "",
              "certFingerprintSHA256": "",
              "certNotBefore": "",
              "certSKI": "",
              "certSerial": "",
              "certIssuerDN": "",
              "certVerified": "NONE",
              "certNotAfter": "",
              "certSubjectDN": "",
              "certPresented": "0",
              "certRevoked": "0",
              "certIssuerSerial": "",
              "certIssuerDNRFC2253": "",
              "certFingerprintSHA1": ""
            },
            "tlsClientRandom": "hgm0KnTLGRnrKD+/UYZs8rUoa85uRwHUXO53nUTGzcs=",
            "tlsExportedAuthenticator": {
              "clientFinished": "b445baf4acb8faba288a6012d6911219dd8e1b445b04c026feb0f8257f276cfa",
              "clientHandshake": "cc953a3fdca1973b6b7f1cf6365848b0501f1678143464f809c456908ad5607d",
              "serverHandshake": "173db56c5e15d9e601294a4783e3d8614d8fed3881501568bff879ccca1ffb0a",
              "serverFinished": "2785988455b406adf0abddd5169fab840dffc5a5b39ea8723ce122c302933265"
            },
            "tlsClientHelloLength": "2057",
            "colo": "SJC",
            "timezone": "America/Los_Angeles",
            "longitude": "-121.89496",
            "latitude": "37.33939",
            "requestPriority": "",
            "postalCode": "95025",
            "city": "San Jose",
            "tlsVersion": "TLSv1.3",
            "regionCode": "CA",
            "asOrganization": "Black Mesa Corporation",
            "metroCode": "807",
            "tlsClientExtensionsSha1Le": "21EpbTruzCEinK1dqXf+8Vt/paY=",
            "tlsClientExtensionsSha1": "3yy7ople0bN8rmpjBGey+WyYhX0=",
            "clientTcpRtt": 1,
            "asn": 46997,
            "edgeRequestKeepAliveStatus": 1
          },
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "headers": {
            "accept-encoding": "gzip, br",
            "accept-language": "zh-CN,zh;q=0.9",
            "cache-control": "no-cache",
            "cf-connecting-ip": "23.247.137.166",
            "cf-ipcountry": "US",
            "cf-ray": "a0247c4fae77c6bb",
            "cf-visitor": "{\"scheme\":\"https\"}",
            "connection": "Upgrade",
            "host": "clip-relay.1732330472.workers.dev",
            "origin": "https://clip-relay.1732330472.workers.dev",
            "pragma": "no-cache",
            "sec-websocket-extensions": "permessage-deflate; client_max_window_bits",
            "sec-websocket-key": "REDACTED",
            "sec-websocket-version": "13",
            "upgrade": "websocket",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "x-forwarded-proto": "https",
            "x-real-ip": "23.247.137.166"
          },
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        },
        "rayId": "a0247c4fae77c6bb"
      },
      "truncated": false,
      "scriptName": "clip-relay",
      "outcome": "canceled",
      "eventType": "fetch",
      "executionModel": "stateless",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247c4fae77c6bb",
      "cpuTimeMs": 1,
      "wallTimeMs": 801
    },
    "$metadata": {
      "id": "01KSMH6BXBPBXY4083P1RR6DEK",
      "requestId": "a0247c4fae77c6bb",
      "trigger": "GET /",
      "service": "clip-relay",
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker-event",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b"
    }
  },
  {
    "source": {
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:55:08.203Z",
    "$workers": {
      "event": {
        "request": {
          "cf": {
            "isEUCountry": false,
            "httpProtocol": "HTTP/1.1",
            "tlsCipher": "AEAD-AES128-GCM-SHA256",
            "continent": "NA",
            "clientAcceptEncoding": "gzip, deflate, br",
            "verifiedBotCategory": "",
            "country": "US",
            "region": "California",
            "tlsClientCiphersSha1": "TkWWX+BVdX+teLUyccOBfetwATE=",
            "tlsClientAuth": {
              "certIssuerDNLegacy": "",
              "certIssuerSKI": "",
              "certSubjectDNRFC2253": "",
              "certSubjectDNLegacy": "",
              "certFingerprintSHA256": "",
              "certNotBefore": "",
              "certSKI": "",
              "certSerial": "",
              "certIssuerDN": "",
              "certVerified": "NONE",
              "certNotAfter": "",
              "certSubjectDN": "",
              "certPresented": "0",
              "certRevoked": "0",
              "certIssuerSerial": "",
              "certIssuerDNRFC2253": "",
              "certFingerprintSHA1": ""
            },
            "tlsClientRandom": "hgm0KnTLGRnrKD+/UYZs8rUoa85uRwHUXO53nUTGzcs=",
            "tlsExportedAuthenticator": {
              "clientFinished": "b445baf4acb8faba288a6012d6911219dd8e1b445b04c026feb0f8257f276cfa",
              "clientHandshake": "cc953a3fdca1973b6b7f1cf6365848b0501f1678143464f809c456908ad5607d",
              "serverHandshake": "173db56c5e15d9e601294a4783e3d8614d8fed3881501568bff879ccca1ffb0a",
              "serverFinished": "2785988455b406adf0abddd5169fab840dffc5a5b39ea8723ce122c302933265"
            },
            "tlsClientHelloLength": "2057",
            "colo": "SJC",
            "timezone": "America/Los_Angeles",
            "longitude": "-121.89496",
            "latitude": "37.33939",
            "requestPriority": "",
            "postalCode": "95025",
            "city": "San Jose",
            "tlsVersion": "TLSv1.3",
            "regionCode": "CA",
            "asOrganization": "Black Mesa Corporation",
            "metroCode": "807",
            "tlsClientExtensionsSha1Le": "21EpbTruzCEinK1dqXf+8Vt/paY=",
            "tlsClientExtensionsSha1": "3yy7ople0bN8rmpjBGey+WyYhX0=",
            "clientTcpRtt": 1,
            "asn": 46997,
            "edgeRequestKeepAliveStatus": 1
          },
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "headers": {
            "accept-encoding": "gzip, br",
            "accept-language": "zh-CN,zh;q=0.9",
            "cache-control": "no-cache",
            "cf-connecting-ip": "23.247.137.166",
            "cf-ipcountry": "US",
            "cf-ray": "a0247c4fae77c6bb",
            "cf-visitor": "{\"scheme\":\"https\"}",
            "connection": "Upgrade",
            "host": "clip-relay.1732330472.workers.dev",
            "origin": "https://clip-relay.1732330472.workers.dev",
            "pragma": "no-cache",
            "sec-websocket-extensions": "permessage-deflate; client_max_window_bits",
            "sec-websocket-key": "REDACTED",
            "sec-websocket-version": "13",
            "upgrade": "websocket",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "x-forwarded-proto": "https",
            "x-real-ip": "23.247.137.166"
          },
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        },
        "rayId": "a0247c4fae77c6bb"
      },
      "truncated": false,
      "scriptName": "clip-relay",
      "outcome": "canceled",
      "eventType": "fetch",
      "executionModel": "durableObject",
      "entrypoint": "Room",
      "durableObjectId": "93554d8bbc991051c6d05232880f06b731250313388f4979300c30d8d6a46d8a",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247c4fae77c6bb",
      "cpuTimeMs": 0,
      "wallTimeMs": 154
    },
    "$metadata": {
      "id": "01KSMH60WMQ7NVF2QZAGTG4WAF",
      "requestId": "a0247c4fae77c6bb",
      "trigger": "GET /",
      "service": "clip-relay",
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker-event",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b"
    }
  },
  {
    "source": {
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:55:07.346Z",
    "$workers": {
      "event": {
        "request": {
          "cf": {
            "isEUCountry": false,
            "tlsClientAuth": {
              "certRFC9440TooLarge": false,
              "certChainRFC9440TooLarge": false,
              "certPresented": "0",
              "certVerified": "NONE",
              "certRevoked": "0",
              "certIssuerDN": "",
              "certSubjectDN": "",
              "certIssuerDNRFC2253": "",
              "certSubjectDNRFC2253": "",
              "certIssuerDNLegacy": "",
              "certSubjectDNLegacy": "",
              "certSerial": "",
              "certIssuerSerial": "",
              "certSKI": "",
              "certIssuerSKI": "",
              "certFingerprintSHA1": "",
              "certFingerprintSHA256": "",
              "certNotBefore": "",
              "certNotAfter": "",
              "certRFC9440": "",
              "certChainRFC9440": ""
            },
            "httpProtocol": "HTTP/2",
            "clientAcceptEncoding": "gzip, deflate, br",
            "requestPriority": "weight=256;exclusive=1",
            "colo": "SJC",
            "asOrganization": "Black Mesa Corporation",
            "country": "US",
            "city": "San Jose",
            "continent": "NA",
            "region": "California",
            "regionCode": "CA",
            "timezone": "America/Los_Angeles",
            "longitude": "-121.89496",
            "latitude": "37.33939",
            "postalCode": "95025",
            "metroCode": "807",
            "tlsVersion": "TLSv1.3",
            "tlsCipher": "AEAD-AES128-GCM-SHA256",
            "tlsClientRandom": "jvFDcGQ86RKIQpRK85jywNkvpmwLMdLq7ZzClPbgLYU=",
            "tlsClientCiphersSha1": "EYU6t/aLxZCrLD9Ij7nRqOz6QDw=",
            "tlsClientExtensionsSha1": "mGcbjORNcsvGkG2u+y9KypJ8F8s=",
            "tlsClientExtensionsSha1Le": "S971+9OA7Ug0DPyu9IXs7gC4kaE=",
            "tlsExportedAuthenticator": {
              "clientHandshake": "d851634b8a2b8223bf882ef268f2f1dac99b68ed97f5e22b1f62c6a00b780960",
              "serverHandshake": "1c26130146ef2aee4ce39d2c096ed2b3030d5aa4af451607f374e3549a94daa1",
              "clientFinished": "aeb8236535c28b8864021302fcc5b753d7650e1ef196444850fafac23c22d8d3",
              "serverFinished": "01292f61027ef65416bf48f80f75069b4d3b3c3fc19b64698d3c22b4454b2d2e"
            },
            "tlsClientHelloLength": "2069",
            "verifiedBotCategory": "",
            "edgeRequestKeepAliveStatus": 1,
            "clientTcpRtt": 1,
            "clientQuicRtt": 0,
            "asn": 46997,
            "edgeL4": {
              "deliveryRate": 12271186
            }
          },
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-encoding": "gzip, br",
            "accept-language": "zh-CN,zh;q=0.9",
            "cache-control": "max-age=0",
            "cf-connecting-ip": "23.247.137.166",
            "cf-ipcountry": "US",
            "cf-ray": "a0247c46efb8e8cc",
            "cf-visitor": "{\"scheme\":\"https\"}",
            "connection": "Keep-Alive",
            "dnt": "1",
            "host": "clip-relay.1732330472.workers.dev",
            "priority": "u=0, i",
            "sec-ch-ua": "\"Chromium\";v=\"148\", \"Google Chrome\";v=\"148\", \"Not/A)Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "x-forwarded-proto": "https",
            "x-real-ip": "23.247.137.166"
          },
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        },
        "rayId": "a0247c46efb8e8cc",
        "response": {
          "status": 200
        }
      },
      "truncated": false,
      "scriptName": "clip-relay",
      "outcome": "ok",
      "eventType": "fetch",
      "executionModel": "stateless",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247c46efb8e8cc",
      "cpuTimeMs": 2,
      "wallTimeMs": 607
    },
    "$metadata": {
      "id": "01KSMH5T2JCC70NJVQWR0EHZMN",
      "requestId": "a0247c46efb8e8cc",
      "trigger": "GET /",
      "service": "clip-relay",
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker-event",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b"
    }
  },
  {
    "source": {
      "level": "info",
      "message": "2026-05-27T10:54:55.528Z"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:54:55.530Z",
    "$workers": {
      "truncated": false,
      "event": {
        "scheduledTime": "2026-05-27T10:54:55.528Z"
      },
      "scriptName": "clip-relay",
      "outcome": "ok",
      "eventType": "alarm",
      "entrypoint": "Room",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "executionModel": "durableObject",
      "durableObjectId": "93554d8bbc991051c6d05232880f06b731250313388f4979300c30d8d6a46d8a",
      "requestId": "GJ2LUNRS13VAXXL2",
      "wallTimeMs": 14,
      "cpuTimeMs": 0
    },
    "$metadata": {
      "id": "01KSMH5EHAE0DBK3K3X3JEWEVN",
      "requestId": "GJ2LUNRS13VAXXL2",
      "trigger": "2026-05-27T10:54:55.528Z",
      "service": "clip-relay",
      "level": "info",
      "message": "2026-05-27T10:54:55.528Z",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker-event",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "alarm",
      "messageTemplate": "<DATETIME>"
    }
  },
  {
    "source": {
      "message": "WebSocket upgrade complete, returning 101"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:54:55.528Z",
    "$workers": {
      "truncated": false,
      "event": {
        "request": {
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        }
      },
      "outcome": "canceled",
      "scriptName": "clip-relay",
      "eventType": "fetch",
      "executionModel": "durableObject",
      "durableObjectId": "93554d8bbc991051c6d05232880f06b731250313388f4979300c30d8d6a46d8a",
      "entrypoint": "Room",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247bf83de1ed3b"
    },
    "$metadata": {
      "id": "01KSMH5NW04PBJ4HWNYZYNENCH",
      "requestId": "a0247bf83de1ed3b",
      "trigger": "GET /",
      "service": "clip-relay",
      "message": "WebSocket upgrade complete, returning 101",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "WebSocket upgrade complete, returning 101"
    }
  },
  {
    "source": {
      "message": "Accepted WebSocket, total: 2"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:54:55.408Z",
    "$workers": {
      "truncated": false,
      "event": {
        "request": {
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        }
      },
      "outcome": "canceled",
      "scriptName": "clip-relay",
      "eventType": "fetch",
      "executionModel": "durableObject",
      "durableObjectId": "93554d8bbc991051c6d05232880f06b731250313388f4979300c30d8d6a46d8a",
      "entrypoint": "Room",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247bf83de1ed3b"
    },
    "$metadata": {
      "id": "01KSMH5NW04PBJ4HWNYZYNENCG",
      "requestId": "a0247bf83de1ed3b",
      "trigger": "GET /",
      "service": "clip-relay",
      "message": "Accepted WebSocket, total: 2",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "Accepted WebSocket, total: 2"
    }
  },
  {
    "source": {
      "message": "Created WebSocketPair"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:54:55.408Z",
    "$workers": {
      "truncated": false,
      "event": {
        "request": {
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        }
      },
      "outcome": "canceled",
      "scriptName": "clip-relay",
      "eventType": "fetch",
      "executionModel": "durableObject",
      "durableObjectId": "93554d8bbc991051c6d05232880f06b731250313388f4979300c30d8d6a46d8a",
      "entrypoint": "Room",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247bf83de1ed3b"
    },
    "$metadata": {
      "id": "01KSMH5NW04PBJ4HWNYZYNENCF",
      "requestId": "a0247bf83de1ed3b",
      "trigger": "GET /",
      "service": "clip-relay",
      "message": "Created WebSocketPair",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "Created WebSocketPair"
    }
  },
  {
    "source": {
      "message": "WebSocket request, token: fsadfa-yjg5bf86vu3b"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:54:55.408Z",
    "$workers": {
      "truncated": false,
      "event": {
        "request": {
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        }
      },
      "outcome": "canceled",
      "scriptName": "clip-relay",
      "eventType": "fetch",
      "executionModel": "durableObject",
      "durableObjectId": "93554d8bbc991051c6d05232880f06b731250313388f4979300c30d8d6a46d8a",
      "entrypoint": "Room",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247bf83de1ed3b"
    },
    "$metadata": {
      "id": "01KSMH5NW04PBJ4HWNYZYNENCE",
      "requestId": "a0247bf83de1ed3b",
      "trigger": "GET /",
      "service": "clip-relay",
      "message": "WebSocket request, token: fsadfa-yjg5bf86vu3b",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "WebSocket request, token: fsadfa-yjg5bf86vu3b"
    }
  },
  {
    "source": {
      "message": "Room.fetch called, path: / upgrade: websocket"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:54:55.408Z",
    "$workers": {
      "truncated": false,
      "event": {
        "request": {
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        }
      },
      "outcome": "canceled",
      "scriptName": "clip-relay",
      "eventType": "fetch",
      "executionModel": "durableObject",
      "durableObjectId": "93554d8bbc991051c6d05232880f06b731250313388f4979300c30d8d6a46d8a",
      "entrypoint": "Room",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247bf83de1ed3b"
    },
    "$metadata": {
      "id": "01KSMH5NW04PBJ4HWNYZYNENCD",
      "requestId": "a0247bf83de1ed3b",
      "trigger": "GET /",
      "service": "clip-relay",
      "message": "Room.fetch called, path: / upgrade: websocket",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "<DOMAIN> called, path: / upgrade: websocket"
    }
  },
  {
    "source": {
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:54:54.770Z",
    "$workers": {
      "event": {
        "request": {
          "cf": {
            "isEUCountry": false,
            "httpProtocol": "HTTP/1.1",
            "tlsCipher": "AEAD-AES128-GCM-SHA256",
            "continent": "NA",
            "clientAcceptEncoding": "gzip, deflate, br",
            "verifiedBotCategory": "",
            "country": "US",
            "region": "California",
            "tlsClientCiphersSha1": "3ITBaTW+cfXno+jbp1Rd9MJFgto=",
            "tlsClientAuth": {
              "certIssuerDNLegacy": "",
              "certIssuerSKI": "",
              "certSubjectDNRFC2253": "",
              "certSubjectDNLegacy": "",
              "certFingerprintSHA256": "",
              "certNotBefore": "",
              "certSKI": "",
              "certSerial": "",
              "certIssuerDN": "",
              "certVerified": "NONE",
              "certNotAfter": "",
              "certSubjectDN": "",
              "certPresented": "0",
              "certRevoked": "0",
              "certIssuerSerial": "",
              "certIssuerDNRFC2253": "",
              "certFingerprintSHA1": ""
            },
            "tlsClientRandom": "UZCBmuV8rc/hU8QK8+KzksagxMv176NXZHoQ3jLoZAw=",
            "tlsExportedAuthenticator": {
              "clientFinished": "07a5ec7589bad9798ae7ae97b82df86f7dc39c2433f308d78a0c94720a1a6348",
              "clientHandshake": "1f5766fd5def2e3148345cdec3ca1c40705e332fc9bf6f9cfd9207e65c6fbc8a",
              "serverHandshake": "9c44f6d11e2d6a2f6c3dbbf7633b17f4bfcd5ceae8d403b0bc52dfb52b8c81de",
              "serverFinished": "d0af38a9a838858197956b1663720c627b5a27712c6bccd1c78b98a1cc2183e9"
            },
            "tlsClientHelloLength": "2057",
            "colo": "SJC",
            "timezone": "America/Los_Angeles",
            "longitude": "-121.89496",
            "latitude": "37.33939",
            "requestPriority": "",
            "postalCode": "95025",
            "city": "San Jose",
            "tlsVersion": "TLSv1.3",
            "regionCode": "CA",
            "asOrganization": "Black Mesa Corporation",
            "metroCode": "807",
            "tlsClientExtensionsSha1Le": "DNLe63uk9rVSRlstJb7s4k4gLmU=",
            "tlsClientExtensionsSha1": "zp3tXatOxsepy6ml0Q402eKP8Rk=",
            "clientTcpRtt": 1,
            "asn": 46997,
            "edgeRequestKeepAliveStatus": 1
          },
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "headers": {
            "accept-encoding": "gzip, br",
            "accept-language": "zh-CN,zh;q=0.9",
            "cache-control": "no-cache",
            "cf-connecting-ip": "23.247.137.166",
            "cf-ipcountry": "US",
            "cf-ray": "a0247bf83de1ed3b",
            "cf-visitor": "{\"scheme\":\"https\"}",
            "connection": "Upgrade",
            "host": "clip-relay.1732330472.workers.dev",
            "origin": "https://clip-relay.1732330472.workers.dev",
            "pragma": "no-cache",
            "sec-websocket-extensions": "permessage-deflate; client_max_window_bits",
            "sec-websocket-key": "REDACTED",
            "sec-websocket-version": "13",
            "upgrade": "websocket",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "x-forwarded-proto": "https",
            "x-real-ip": "23.247.137.166"
          },
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        },
        "rayId": "a0247bf83de1ed3b"
      },
      "truncated": false,
      "scriptName": "clip-relay",
      "outcome": "canceled",
      "eventType": "fetch",
      "executionModel": "stateless",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247bf83de1ed3b",
      "cpuTimeMs": 3,
      "wallTimeMs": 792
    },
    "$metadata": {
      "id": "01KSMH5RVFR132ZG26C6MP16SA",
      "requestId": "a0247bf83de1ed3b",
      "trigger": "GET /",
      "service": "clip-relay",
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker-event",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b"
    }
  },
  {
    "source": {
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:54:54.168Z",
    "$workers": {
      "event": {
        "request": {
          "cf": {
            "isEUCountry": false,
            "httpProtocol": "HTTP/1.1",
            "tlsCipher": "AEAD-AES128-GCM-SHA256",
            "continent": "NA",
            "clientAcceptEncoding": "gzip, deflate, br",
            "verifiedBotCategory": "",
            "country": "US",
            "region": "California",
            "tlsClientCiphersSha1": "3ITBaTW+cfXno+jbp1Rd9MJFgto=",
            "tlsClientAuth": {
              "certIssuerDNLegacy": "",
              "certIssuerSKI": "",
              "certSubjectDNRFC2253": "",
              "certSubjectDNLegacy": "",
              "certFingerprintSHA256": "",
              "certNotBefore": "",
              "certSKI": "",
              "certSerial": "",
              "certIssuerDN": "",
              "certVerified": "NONE",
              "certNotAfter": "",
              "certSubjectDN": "",
              "certPresented": "0",
              "certRevoked": "0",
              "certIssuerSerial": "",
              "certIssuerDNRFC2253": "",
              "certFingerprintSHA1": ""
            },
            "tlsClientRandom": "UZCBmuV8rc/hU8QK8+KzksagxMv176NXZHoQ3jLoZAw=",
            "tlsExportedAuthenticator": {
              "clientFinished": "07a5ec7589bad9798ae7ae97b82df86f7dc39c2433f308d78a0c94720a1a6348",
              "clientHandshake": "1f5766fd5def2e3148345cdec3ca1c40705e332fc9bf6f9cfd9207e65c6fbc8a",
              "serverHandshake": "9c44f6d11e2d6a2f6c3dbbf7633b17f4bfcd5ceae8d403b0bc52dfb52b8c81de",
              "serverFinished": "d0af38a9a838858197956b1663720c627b5a27712c6bccd1c78b98a1cc2183e9"
            },
            "tlsClientHelloLength": "2057",
            "colo": "SJC",
            "timezone": "America/Los_Angeles",
            "longitude": "-121.89496",
            "latitude": "37.33939",
            "requestPriority": "",
            "postalCode": "95025",
            "city": "San Jose",
            "tlsVersion": "TLSv1.3",
            "regionCode": "CA",
            "asOrganization": "Black Mesa Corporation",
            "metroCode": "807",
            "tlsClientExtensionsSha1Le": "DNLe63uk9rVSRlstJb7s4k4gLmU=",
            "tlsClientExtensionsSha1": "zp3tXatOxsepy6ml0Q402eKP8Rk=",
            "clientTcpRtt": 1,
            "asn": 46997,
            "edgeRequestKeepAliveStatus": 1
          },
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "headers": {
            "accept-encoding": "gzip, br",
            "accept-language": "zh-CN,zh;q=0.9",
            "cache-control": "no-cache",
            "cf-connecting-ip": "23.247.137.166",
            "cf-ipcountry": "US",
            "cf-ray": "a0247bf83de1ed3b",
            "cf-visitor": "{\"scheme\":\"https\"}",
            "connection": "Upgrade",
            "host": "clip-relay.1732330472.workers.dev",
            "origin": "https://clip-relay.1732330472.workers.dev",
            "pragma": "no-cache",
            "sec-websocket-extensions": "permessage-deflate; client_max_window_bits",
            "sec-websocket-key": "REDACTED",
            "sec-websocket-version": "13",
            "upgrade": "websocket",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "x-forwarded-proto": "https",
            "x-real-ip": "23.247.137.166"
          },
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        },
        "rayId": "a0247bf83de1ed3b"
      },
      "truncated": false,
      "scriptName": "clip-relay",
      "outcome": "canceled",
      "eventType": "fetch",
      "executionModel": "durableObject",
      "entrypoint": "Room",
      "durableObjectId": "93554d8bbc991051c6d05232880f06b731250313388f4979300c30d8d6a46d8a",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247bf83de1ed3b",
      "cpuTimeMs": 0,
      "wallTimeMs": 152
    },
    "$metadata": {
      "id": "01KSMH5NW04PBJ4HWNYZYNENCC",
      "requestId": "a0247bf83de1ed3b",
      "trigger": "GET /",
      "service": "clip-relay",
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker-event",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b"
    }
  },
  {
    "source": {
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:54:53.290Z",
    "$workers": {
      "event": {
        "request": {
          "cf": {
            "isEUCountry": false,
            "tlsClientAuth": {
              "certRFC9440TooLarge": false,
              "certChainRFC9440TooLarge": false,
              "certPresented": "0",
              "certVerified": "NONE",
              "certRevoked": "0",
              "certIssuerDN": "",
              "certSubjectDN": "",
              "certIssuerDNRFC2253": "",
              "certSubjectDNRFC2253": "",
              "certIssuerDNLegacy": "",
              "certSubjectDNLegacy": "",
              "certSerial": "",
              "certIssuerSerial": "",
              "certSKI": "",
              "certIssuerSKI": "",
              "certFingerprintSHA1": "",
              "certFingerprintSHA256": "",
              "certNotBefore": "",
              "certNotAfter": "",
              "certRFC9440": "",
              "certChainRFC9440": ""
            },
            "httpProtocol": "HTTP/2",
            "clientAcceptEncoding": "gzip, deflate, br",
            "requestPriority": "weight=256;exclusive=1",
            "colo": "SJC",
            "asOrganization": "Black Mesa Corporation",
            "country": "US",
            "city": "San Jose",
            "continent": "NA",
            "region": "California",
            "regionCode": "CA",
            "timezone": "America/Los_Angeles",
            "longitude": "-121.89496",
            "latitude": "37.33939",
            "postalCode": "95025",
            "metroCode": "807",
            "tlsVersion": "TLSv1.3",
            "tlsCipher": "AEAD-AES128-GCM-SHA256",
            "tlsClientRandom": "jvFDcGQ86RKIQpRK85jywNkvpmwLMdLq7ZzClPbgLYU=",
            "tlsClientCiphersSha1": "EYU6t/aLxZCrLD9Ij7nRqOz6QDw=",
            "tlsClientExtensionsSha1": "mGcbjORNcsvGkG2u+y9KypJ8F8s=",
            "tlsClientExtensionsSha1Le": "S971+9OA7Ug0DPyu9IXs7gC4kaE=",
            "tlsExportedAuthenticator": {
              "clientHandshake": "d851634b8a2b8223bf882ef268f2f1dac99b68ed97f5e22b1f62c6a00b780960",
              "serverHandshake": "1c26130146ef2aee4ce39d2c096ed2b3030d5aa4af451607f374e3549a94daa1",
              "clientFinished": "aeb8236535c28b8864021302fcc5b753d7650e1ef196444850fafac23c22d8d3",
              "serverFinished": "01292f61027ef65416bf48f80f75069b4d3b3c3fc19b64698d3c22b4454b2d2e"
            },
            "tlsClientHelloLength": "2069",
            "verifiedBotCategory": "",
            "edgeRequestKeepAliveStatus": 1,
            "clientTcpRtt": 1,
            "clientQuicRtt": 0,
            "asn": 46997,
            "edgeL4": {
              "deliveryRate": 12271186
            }
          },
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-encoding": "gzip, br",
            "accept-language": "zh-CN,zh;q=0.9",
            "cache-control": "max-age=0",
            "cf-connecting-ip": "23.247.137.166",
            "cf-ipcountry": "US",
            "cf-ray": "a0247bef0f28e8cc",
            "cf-visitor": "{\"scheme\":\"https\"}",
            "connection": "Keep-Alive",
            "dnt": "1",
            "host": "clip-relay.1732330472.workers.dev",
            "priority": "u=0, i",
            "sec-ch-ua": "\"Chromium\";v=\"148\", \"Google Chrome\";v=\"148\", \"Not/A)Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "x-forwarded-proto": "https",
            "x-real-ip": "23.247.137.166"
          },
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        },
        "rayId": "a0247bef0f28e8cc",
        "response": {
          "status": 200
        }
      },
      "truncated": false,
      "scriptName": "clip-relay",
      "outcome": "ok",
      "eventType": "fetch",
      "executionModel": "stateless",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247bef0f28e8cc",
      "cpuTimeMs": 2,
      "wallTimeMs": 609
    },
    "$metadata": {
      "id": "01KSMH5CBA35JWDB687G25GJA6",
      "requestId": "a0247bef0f28e8cc",
      "trigger": "GET /",
      "service": "clip-relay",
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker-event",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b"
    }
  },
  {
    "source": {
      "level": "info",
      "message": "2026-05-27T10:54:43.604Z"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:54:43.605Z",
    "$workers": {
      "truncated": false,
      "event": {
        "scheduledTime": "2026-05-27T10:54:43.604Z"
      },
      "scriptName": "clip-relay",
      "outcome": "ok",
      "eventType": "alarm",
      "entrypoint": "Room",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "executionModel": "durableObject",
      "durableObjectId": "93554d8bbc991051c6d05232880f06b731250313388f4979300c30d8d6a46d8a",
      "requestId": "YRYP5VINU24MTVU8",
      "wallTimeMs": 13,
      "cpuTimeMs": 0
    },
    "$metadata": {
      "id": "01KSMH52WNZYKRKBBV1F2T37MD",
      "requestId": "YRYP5VINU24MTVU8",
      "trigger": "2026-05-27T10:54:43.604Z",
      "service": "clip-relay",
      "level": "info",
      "message": "2026-05-27T10:54:43.604Z",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker-event",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "alarm",
      "messageTemplate": "<DATETIME>"
    }
  },
  {
    "source": {
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:54:41.450Z",
    "$workers": {
      "event": {
        "request": {
          "cf": {
            "isEUCountry": false,
            "tlsClientAuth": {
              "certRFC9440TooLarge": false,
              "certChainRFC9440TooLarge": false,
              "certPresented": "0",
              "certVerified": "NONE",
              "certRevoked": "0",
              "certIssuerDN": "",
              "certSubjectDN": "",
              "certIssuerDNRFC2253": "",
              "certSubjectDNRFC2253": "",
              "certIssuerDNLegacy": "",
              "certSubjectDNLegacy": "",
              "certSerial": "",
              "certIssuerSerial": "",
              "certSKI": "",
              "certIssuerSKI": "",
              "certFingerprintSHA1": "",
              "certFingerprintSHA256": "",
              "certNotBefore": "",
              "certNotAfter": "",
              "certRFC9440": "",
              "certChainRFC9440": ""
            },
            "httpProtocol": "HTTP/2",
            "clientAcceptEncoding": "gzip, deflate, br",
            "requestPriority": "weight=256;exclusive=1",
            "colo": "SJC",
            "asOrganization": "Black Mesa Corporation",
            "country": "US",
            "city": "San Jose",
            "continent": "NA",
            "region": "California",
            "regionCode": "CA",
            "timezone": "America/Los_Angeles",
            "longitude": "-121.89496",
            "latitude": "37.33939",
            "postalCode": "95025",
            "metroCode": "807",
            "tlsVersion": "TLSv1.3",
            "tlsCipher": "AEAD-AES128-GCM-SHA256",
            "tlsClientRandom": "jvFDcGQ86RKIQpRK85jywNkvpmwLMdLq7ZzClPbgLYU=",
            "tlsClientCiphersSha1": "EYU6t/aLxZCrLD9Ij7nRqOz6QDw=",
            "tlsClientExtensionsSha1": "mGcbjORNcsvGkG2u+y9KypJ8F8s=",
            "tlsClientExtensionsSha1Le": "S971+9OA7Ug0DPyu9IXs7gC4kaE=",
            "tlsExportedAuthenticator": {
              "clientHandshake": "d851634b8a2b8223bf882ef268f2f1dac99b68ed97f5e22b1f62c6a00b780960",
              "serverHandshake": "1c26130146ef2aee4ce39d2c096ed2b3030d5aa4af451607f374e3549a94daa1",
              "clientFinished": "aeb8236535c28b8864021302fcc5b753d7650e1ef196444850fafac23c22d8d3",
              "serverFinished": "01292f61027ef65416bf48f80f75069b4d3b3c3fc19b64698d3c22b4454b2d2e"
            },
            "tlsClientHelloLength": "2069",
            "verifiedBotCategory": "",
            "edgeRequestKeepAliveStatus": 1,
            "clientTcpRtt": 1,
            "clientQuicRtt": 0,
            "asn": 46997,
            "edgeL4": {
              "deliveryRate": 11302688
            }
          },
          "url": "https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
          "method": "GET",
          "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-encoding": "gzip, br",
            "accept-language": "zh-CN,zh;q=0.9",
            "cache-control": "max-age=0",
            "cf-connecting-ip": "23.247.137.166",
            "cf-ipcountry": "US",
            "cf-ray": "a0247ba50f24e8cc",
            "cf-visitor": "{\"scheme\":\"https\"}",
            "connection": "Keep-Alive",
            "dnt": "1",
            "host": "clip-relay.1732330472.workers.dev",
            "priority": "u=0, i",
            "sec-ch-ua": "\"Chromium\";v=\"148\", \"Google Chrome\";v=\"148\", \"Not/A)Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "x-forwarded-proto": "https",
            "x-real-ip": "23.247.137.166"
          },
          "path": "/",
          "search": {
            "token": "fsadfa-yjg5bf86vu3b"
          }
        },
        "rayId": "a0247ba50f24e8cc",
        "response": {
          "status": 200
        }
      },
      "truncated": false,
      "scriptName": "clip-relay",
      "outcome": "ok",
      "eventType": "fetch",
      "executionModel": "stateless",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247ba50f24e8cc",
      "cpuTimeMs": 2,
      "wallTimeMs": 609
    },
    "$metadata": {
      "id": "01KSMH50SA8D8J5CH9QTK6BPDR",
      "requestId": "a0247ba50f24e8cc",
      "trigger": "GET /",
      "service": "clip-relay",
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker-event",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "GET https://clip-relay.1732330472.workers.dev/?token=fsadfa-yjg5bf86vu3b"
    }
  },
  {
    "source": {
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/api/admin/rooms"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:54:36.775Z",
    "$workers": {
      "event": {
        "request": {
          "cf": {
            "isEUCountry": false,
            "tlsClientAuth": {
              "certRFC9440TooLarge": false,
              "certChainRFC9440TooLarge": false,
              "certPresented": "0",
              "certVerified": "NONE",
              "certRevoked": "0",
              "certIssuerDN": "",
              "certSubjectDN": "",
              "certIssuerDNRFC2253": "",
              "certSubjectDNRFC2253": "",
              "certIssuerDNLegacy": "",
              "certSubjectDNLegacy": "",
              "certSerial": "",
              "certIssuerSerial": "",
              "certSKI": "",
              "certIssuerSKI": "",
              "certFingerprintSHA1": "",
              "certFingerprintSHA256": "",
              "certNotBefore": "",
              "certNotAfter": "",
              "certRFC9440": "",
              "certChainRFC9440": ""
            },
            "httpProtocol": "HTTP/2",
            "clientAcceptEncoding": "gzip, deflate, br",
            "requestPriority": "weight=220;exclusive=1",
            "colo": "SJC",
            "asOrganization": "Black Mesa Corporation",
            "country": "US",
            "city": "San Jose",
            "continent": "NA",
            "region": "California",
            "regionCode": "CA",
            "timezone": "America/Los_Angeles",
            "longitude": "-121.89496",
            "latitude": "37.33939",
            "postalCode": "95025",
            "metroCode": "807",
            "tlsVersion": "TLSv1.3",
            "tlsCipher": "AEAD-AES128-GCM-SHA256",
            "tlsClientRandom": "jvFDcGQ86RKIQpRK85jywNkvpmwLMdLq7ZzClPbgLYU=",
            "tlsClientCiphersSha1": "EYU6t/aLxZCrLD9Ij7nRqOz6QDw=",
            "tlsClientExtensionsSha1": "mGcbjORNcsvGkG2u+y9KypJ8F8s=",
            "tlsClientExtensionsSha1Le": "S971+9OA7Ug0DPyu9IXs7gC4kaE=",
            "tlsExportedAuthenticator": {
              "clientHandshake": "d851634b8a2b8223bf882ef268f2f1dac99b68ed97f5e22b1f62c6a00b780960",
              "serverHandshake": "1c26130146ef2aee4ce39d2c096ed2b3030d5aa4af451607f374e3549a94daa1",
              "clientFinished": "aeb8236535c28b8864021302fcc5b753d7650e1ef196444850fafac23c22d8d3",
              "serverFinished": "01292f61027ef65416bf48f80f75069b4d3b3c3fc19b64698d3c22b4454b2d2e"
            },
            "tlsClientHelloLength": "2069",
            "verifiedBotCategory": "",
            "edgeRequestKeepAliveStatus": 1,
            "clientTcpRtt": 1,
            "clientQuicRtt": 0,
            "asn": 46997,
            "edgeL4": {
              "deliveryRate": 11302688
            }
          },
          "url": "https://clip-relay.1732330472.workers.dev/api/admin/rooms",
          "method": "GET",
          "headers": {
            "accept": "*/*",
            "accept-encoding": "gzip, br",
            "accept-language": "zh-CN,zh;q=0.9",
            "authorization": "********",
            "cf-connecting-ip": "23.247.137.166",
            "cf-ipcountry": "US",
            "cf-ray": "a0247b87df5ae8cc",
            "cf-visitor": "{\"scheme\":\"https\"}",
            "connection": "Keep-Alive",
            "dnt": "1",
            "host": "clip-relay.1732330472.workers.dev",
            "priority": "u=1, i",
            "referer": "https://clip-relay.1732330472.workers.dev/admin",
            "sec-ch-ua": "\"Chromium\";v=\"148\", \"Google Chrome\";v=\"148\", \"Not/A)Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "x-forwarded-proto": "https",
            "x-real-ip": "23.247.137.166"
          },
          "path": "/api/admin/rooms"
        },
        "rayId": "a0247b87df5ae8cc",
        "response": {
          "status": 200
        }
      },
      "truncated": false,
      "scriptName": "clip-relay",
      "outcome": "ok",
      "eventType": "fetch",
      "executionModel": "stateless",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247b87df5ae8cc",
      "cpuTimeMs": 2,
      "wallTimeMs": 848
    },
    "$metadata": {
      "id": "01KSMH4WMCQR76DB5K03NABTR7",
      "requestId": "a0247b87df5ae8cc",
      "trigger": "GET /api/admin/rooms",
      "service": "clip-relay",
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/api/admin/rooms",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker-event",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "GET https://clip-relay.1732330472.workers.dev/api/admin/rooms"
    }
  },
  {
    "source": {
      "level": "info",
      "message": "POST https://clip-relay.1732330472.workers.dev/api/admin/login"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:54:35.788Z",
    "$workers": {
      "event": {
        "request": {
          "cf": {
            "isEUCountry": false,
            "tlsClientAuth": {
              "certRFC9440TooLarge": false,
              "certChainRFC9440TooLarge": false,
              "certPresented": "0",
              "certVerified": "NONE",
              "certRevoked": "0",
              "certIssuerDN": "",
              "certSubjectDN": "",
              "certIssuerDNRFC2253": "",
              "certSubjectDNRFC2253": "",
              "certIssuerDNLegacy": "",
              "certSubjectDNLegacy": "",
              "certSerial": "",
              "certIssuerSerial": "",
              "certSKI": "",
              "certIssuerSKI": "",
              "certFingerprintSHA1": "",
              "certFingerprintSHA256": "",
              "certNotBefore": "",
              "certNotAfter": "",
              "certRFC9440": "",
              "certChainRFC9440": ""
            },
            "httpProtocol": "HTTP/2",
            "clientAcceptEncoding": "gzip, deflate, br",
            "requestPriority": "weight=220;exclusive=1",
            "colo": "SJC",
            "asOrganization": "Black Mesa Corporation",
            "country": "US",
            "city": "San Jose",
            "continent": "NA",
            "region": "California",
            "regionCode": "CA",
            "timezone": "America/Los_Angeles",
            "longitude": "-121.89496",
            "latitude": "37.33939",
            "postalCode": "95025",
            "metroCode": "807",
            "tlsVersion": "TLSv1.3",
            "tlsCipher": "AEAD-AES128-GCM-SHA256",
            "tlsClientRandom": "jvFDcGQ86RKIQpRK85jywNkvpmwLMdLq7ZzClPbgLYU=",
            "tlsClientCiphersSha1": "EYU6t/aLxZCrLD9Ij7nRqOz6QDw=",
            "tlsClientExtensionsSha1": "mGcbjORNcsvGkG2u+y9KypJ8F8s=",
            "tlsClientExtensionsSha1Le": "S971+9OA7Ug0DPyu9IXs7gC4kaE=",
            "tlsExportedAuthenticator": {
              "clientHandshake": "d851634b8a2b8223bf882ef268f2f1dac99b68ed97f5e22b1f62c6a00b780960",
              "serverHandshake": "1c26130146ef2aee4ce39d2c096ed2b3030d5aa4af451607f374e3549a94daa1",
              "clientFinished": "aeb8236535c28b8864021302fcc5b753d7650e1ef196444850fafac23c22d8d3",
              "serverFinished": "01292f61027ef65416bf48f80f75069b4d3b3c3fc19b64698d3c22b4454b2d2e"
            },
            "tlsClientHelloLength": "2069",
            "verifiedBotCategory": "",
            "edgeRequestKeepAliveStatus": 1,
            "clientTcpRtt": 1,
            "clientQuicRtt": 0,
            "asn": 46997,
            "edgeL4": {
              "deliveryRate": 11302688
            }
          },
          "url": "https://clip-relay.1732330472.workers.dev/api/admin/login",
          "method": "POST",
          "headers": {
            "accept": "*/*",
            "accept-encoding": "gzip, br",
            "accept-language": "zh-CN,zh;q=0.9",
            "cf-connecting-ip": "23.247.137.166",
            "cf-ipcountry": "US",
            "cf-ray": "a0247b81aeafe8cc",
            "cf-visitor": "{\"scheme\":\"https\"}",
            "connection": "Keep-Alive",
            "content-length": "20",
            "content-type": "application/json",
            "dnt": "1",
            "host": "clip-relay.1732330472.workers.dev",
            "origin": "https://clip-relay.1732330472.workers.dev",
            "priority": "u=1, i",
            "referer": "https://clip-relay.1732330472.workers.dev/admin",
            "sec-ch-ua": "\"Chromium\";v=\"148\", \"Google Chrome\";v=\"148\", \"Not/A)Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "x-forwarded-proto": "https",
            "x-real-ip": "23.247.137.166"
          },
          "path": "/api/admin/login"
        },
        "rayId": "a0247b81aeafe8cc",
        "response": {
          "status": 200
        }
      },
      "truncated": false,
      "scriptName": "clip-relay",
      "outcome": "ok",
      "eventType": "fetch",
      "executionModel": "stateless",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247b81aeafe8cc",
      "cpuTimeMs": 2,
      "wallTimeMs": 732
    },
    "$metadata": {
      "id": "01KSMH4V8CR6QTXATVMWNDRRPG",
      "requestId": "a0247b81aeafe8cc",
      "trigger": "POST /api/admin/login",
      "service": "clip-relay",
      "level": "info",
      "message": "POST https://clip-relay.1732330472.workers.dev/api/admin/login",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker-event",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "POST https://clip-relay.1732330472.workers.dev/api/admin/login"
    }
  },
  {
    "source": {
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/api/admin/rooms"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:54:30.155Z",
    "$workers": {
      "event": {
        "request": {
          "cf": {
            "isEUCountry": false,
            "tlsClientAuth": {
              "certRFC9440TooLarge": false,
              "certChainRFC9440TooLarge": false,
              "certPresented": "0",
              "certVerified": "NONE",
              "certRevoked": "0",
              "certIssuerDN": "",
              "certSubjectDN": "",
              "certIssuerDNRFC2253": "",
              "certSubjectDNRFC2253": "",
              "certIssuerDNLegacy": "",
              "certSubjectDNLegacy": "",
              "certSerial": "",
              "certIssuerSerial": "",
              "certSKI": "",
              "certIssuerSKI": "",
              "certFingerprintSHA1": "",
              "certFingerprintSHA256": "",
              "certNotBefore": "",
              "certNotAfter": "",
              "certRFC9440": "",
              "certChainRFC9440": ""
            },
            "httpProtocol": "HTTP/2",
            "clientAcceptEncoding": "gzip, deflate, br",
            "requestPriority": "weight=220;exclusive=1",
            "colo": "SJC",
            "asOrganization": "Black Mesa Corporation",
            "country": "US",
            "city": "San Jose",
            "continent": "NA",
            "region": "California",
            "regionCode": "CA",
            "timezone": "America/Los_Angeles",
            "longitude": "-121.89496",
            "latitude": "37.33939",
            "postalCode": "95025",
            "metroCode": "807",
            "tlsVersion": "TLSv1.3",
            "tlsCipher": "AEAD-AES128-GCM-SHA256",
            "tlsClientRandom": "jvFDcGQ86RKIQpRK85jywNkvpmwLMdLq7ZzClPbgLYU=",
            "tlsClientCiphersSha1": "EYU6t/aLxZCrLD9Ij7nRqOz6QDw=",
            "tlsClientExtensionsSha1": "mGcbjORNcsvGkG2u+y9KypJ8F8s=",
            "tlsClientExtensionsSha1Le": "S971+9OA7Ug0DPyu9IXs7gC4kaE=",
            "tlsExportedAuthenticator": {
              "clientHandshake": "d851634b8a2b8223bf882ef268f2f1dac99b68ed97f5e22b1f62c6a00b780960",
              "serverHandshake": "1c26130146ef2aee4ce39d2c096ed2b3030d5aa4af451607f374e3549a94daa1",
              "clientFinished": "aeb8236535c28b8864021302fcc5b753d7650e1ef196444850fafac23c22d8d3",
              "serverFinished": "01292f61027ef65416bf48f80f75069b4d3b3c3fc19b64698d3c22b4454b2d2e"
            },
            "tlsClientHelloLength": "2069",
            "verifiedBotCategory": "",
            "edgeRequestKeepAliveStatus": 1,
            "clientTcpRtt": 1,
            "clientQuicRtt": 0,
            "asn": 46997,
            "edgeL4": {
              "deliveryRate": 11302688
            }
          },
          "url": "https://clip-relay.1732330472.workers.dev/api/admin/rooms",
          "method": "GET",
          "headers": {
            "accept": "*/*",
            "accept-encoding": "gzip, br",
            "accept-language": "zh-CN,zh;q=0.9",
            "authorization": "********",
            "cf-connecting-ip": "23.247.137.166",
            "cf-ipcountry": "US",
            "cf-ray": "a0247b5e7e59e8cc",
            "cf-visitor": "{\"scheme\":\"https\"}",
            "connection": "Keep-Alive",
            "dnt": "1",
            "host": "clip-relay.1732330472.workers.dev",
            "priority": "u=1, i",
            "referer": "https://clip-relay.1732330472.workers.dev/admin",
            "sec-ch-ua": "\"Chromium\";v=\"148\", \"Google Chrome\";v=\"148\", \"Not/A)Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "x-forwarded-proto": "https",
            "x-real-ip": "23.247.137.166"
          },
          "path": "/api/admin/rooms"
        },
        "rayId": "a0247b5e7e59e8cc",
        "response": {
          "status": 401
        }
      },
      "truncated": false,
      "scriptName": "clip-relay",
      "outcome": "ok",
      "eventType": "fetch",
      "executionModel": "stateless",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247b5e7e59e8cc",
      "cpuTimeMs": 1,
      "wallTimeMs": 600
    },
    "$metadata": {
      "id": "01KSMH4NSJ3ZJHAN9FF1PM86DF",
      "requestId": "a0247b5e7e59e8cc",
      "trigger": "GET /api/admin/rooms",
      "service": "clip-relay",
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/api/admin/rooms",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker-event",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "GET https://clip-relay.1732330472.workers.dev/api/admin/rooms"
    }
  },
  {
    "source": {
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/admin"
    },
    "dataset": "cloudflare-workers",
    "timestamp": "2026-05-27T10:54:27.290Z",
    "$workers": {
      "event": {
        "request": {
          "cf": {
            "isEUCountry": false,
            "tlsClientAuth": {
              "certRFC9440TooLarge": false,
              "certChainRFC9440TooLarge": false,
              "certPresented": "0",
              "certVerified": "NONE",
              "certRevoked": "0",
              "certIssuerDN": "",
              "certSubjectDN": "",
              "certIssuerDNRFC2253": "",
              "certSubjectDNRFC2253": "",
              "certIssuerDNLegacy": "",
              "certSubjectDNLegacy": "",
              "certSerial": "",
              "certIssuerSerial": "",
              "certSKI": "",
              "certIssuerSKI": "",
              "certFingerprintSHA1": "",
              "certFingerprintSHA256": "",
              "certNotBefore": "",
              "certNotAfter": "",
              "certRFC9440": "",
              "certChainRFC9440": ""
            },
            "httpProtocol": "HTTP/2",
            "clientAcceptEncoding": "gzip, deflate, br",
            "requestPriority": "weight=256;exclusive=1",
            "colo": "SJC",
            "asOrganization": "Black Mesa Corporation",
            "country": "US",
            "city": "San Jose",
            "continent": "NA",
            "region": "California",
            "regionCode": "CA",
            "timezone": "America/Los_Angeles",
            "longitude": "-121.89496",
            "latitude": "37.33939",
            "postalCode": "95025",
            "metroCode": "807",
            "tlsVersion": "TLSv1.3",
            "tlsCipher": "AEAD-AES128-GCM-SHA256",
            "tlsClientRandom": "jvFDcGQ86RKIQpRK85jywNkvpmwLMdLq7ZzClPbgLYU=",
            "tlsClientCiphersSha1": "EYU6t/aLxZCrLD9Ij7nRqOz6QDw=",
            "tlsClientExtensionsSha1": "mGcbjORNcsvGkG2u+y9KypJ8F8s=",
            "tlsClientExtensionsSha1Le": "S971+9OA7Ug0DPyu9IXs7gC4kaE=",
            "tlsExportedAuthenticator": {
              "clientHandshake": "d851634b8a2b8223bf882ef268f2f1dac99b68ed97f5e22b1f62c6a00b780960",
              "serverHandshake": "1c26130146ef2aee4ce39d2c096ed2b3030d5aa4af451607f374e3549a94daa1",
              "clientFinished": "aeb8236535c28b8864021302fcc5b753d7650e1ef196444850fafac23c22d8d3",
              "serverFinished": "01292f61027ef65416bf48f80f75069b4d3b3c3fc19b64698d3c22b4454b2d2e"
            },
            "tlsClientHelloLength": "2069",
            "verifiedBotCategory": "",
            "edgeRequestKeepAliveStatus": 1,
            "clientTcpRtt": 3,
            "clientQuicRtt": 0,
            "asn": 46997,
            "edgeL4": {
              "deliveryRate": 10375796
            }
          },
          "url": "https://clip-relay.1732330472.workers.dev/admin",
          "method": "GET",
          "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-encoding": "gzip, br",
            "accept-language": "zh-CN,zh;q=0.9",
            "cache-control": "max-age=0",
            "cf-connecting-ip": "23.247.137.166",
            "cf-ipcountry": "US",
            "cf-ray": "a0247b4c8a5be8cc",
            "cf-visitor": "{\"scheme\":\"https\"}",
            "connection": "Keep-Alive",
            "dnt": "1",
            "host": "clip-relay.1732330472.workers.dev",
            "priority": "u=0, i",
            "sec-ch-ua": "\"Chromium\";v=\"148\", \"Google Chrome\";v=\"148\", \"Not/A)Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "x-forwarded-proto": "https",
            "x-real-ip": "23.247.137.166"
          },
          "path": "/admin"
        },
        "rayId": "a0247b4c8a5be8cc",
        "response": {
          "status": 200
        }
      },
      "truncated": false,
      "scriptName": "clip-relay",
      "outcome": "ok",
      "eventType": "fetch",
      "executionModel": "stateless",
      "scriptVersion": {
        "id": "ad4366db-1c2d-40da-89d1-c282e6d57005"
      },
      "requestId": "a0247b4c8a5be8cc",
      "cpuTimeMs": 2,
      "wallTimeMs": 610
    },
    "$metadata": {
      "id": "01KSMH4JYTQWBRBQXS3HWTYQ0C",
      "requestId": "a0247b4c8a5be8cc",
      "trigger": "GET /admin",
      "service": "clip-relay",
      "level": "info",
      "message": "GET https://clip-relay.1732330472.workers.dev/admin",
      "account": "d244e2866135d92cd4d95c8fcbffb040",
      "type": "cf-worker-event",
      "fingerprint": "de732e5c2a5d7149ef4ec45950983f5a",
      "origin": "fetch",
      "messageTemplate": "GET https://clip-relay.1732330472.workers.dev/admin"
    }
  }
]