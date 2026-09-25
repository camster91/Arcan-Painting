import subprocess,json,sys
prefix=['docker','exec','-i','arcan-db','sh','-c','exec psql -X -qAt -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"']
def query(s):
 r=subprocess.run(prefix,input=s,text=True,capture_output=True)
 if r.returncode: raise RuntimeError('Source query failed')
 return r.stdout
tables=json.loads(query("SELECT json_agg(tablename ORDER BY tablename) FROM pg_tables WHERE schemaname='public';"))
parts=['BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;']
parts.append("SELECT json_build_object('kind','columns','data',json_agg(c)) FROM (SELECT * FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position)c;")
parts.append("SELECT json_build_object('kind','constraints','data',json_agg(c)) FROM (SELECT conrelid::regclass::text AS table_name,conname,contype,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE connamespace='public'::regnamespace)c;")
parts.append("SELECT json_build_object('kind','indexes','data',json_agg(c)) FROM (SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public')c;")
parts.append("SELECT json_build_object('kind','sequences','data',json_agg(c)) FROM (SELECT sequencename,last_value,increment_by FROM pg_sequences WHERE schemaname='public')c;")
columns=json.loads(query("SELECT json_agg(c) FROM (SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' ORDER BY ordinal_position)c;"))
for t in tables:
 assert t.replace('_','').isalnum()
 fields=','.join("'%s', %s::text" % (c['column_name'], ('to_json(t."%s")' if c['data_type']=='ARRAY' else 't."%s"') % c['column_name']) for c in columns if c['table_name']==t)
 parts.append(f'''SELECT json_build_object('kind','rows','table','{t}','data',COALESCE(json_agg(json_build_object({fields})),'[]'::json)) FROM "{t}" t;''')
parts.append('COMMIT;')
raw=query('\n'.join(parts)); result=[]; decoder=json.JSONDecoder()
while raw.strip():
 item,n=decoder.raw_decode(raw.lstrip()); result.append(item); raw=raw.lstrip()[n:]
json.dump(result,sys.stdout)
