CREATE TABLE test
(
  id bigserial NOT NULL,
  key character varying(32) NOT NULL,
  value bigint NOT NULL,
  CONSTRAINT test_pkey PRIMARY KEY (id)
)
