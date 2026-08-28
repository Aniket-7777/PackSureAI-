from app.database import supabase


def test_connection():
    try:
        result = (
            supabase
            .table("products")
            .select("id")
            .limit(1)
            .execute()
        )

        print("================================")
        print("SUPABASE CONNECTION SUCCESSFUL")
        print("================================")
        print("Rows found:", len(result.data))

    except Exception as error:
        print("================================")
        print("SUPABASE CONNECTION FAILED")
        print("================================")
        print(error)


if __name__ == "__main__":
    test_connection()