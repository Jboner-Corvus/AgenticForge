import math

def calculate_area(radius_val):
    circle_area = math.pi * radius_val * radius_val
    return circle_area

def calculate_circumference(radius_val):
    circle_circumference = 2 * math.pi * radius_val
    return circle_circumference

def main_function():
    my_radius = 5
    area_result = calculate_area(my_radius)
    circumference_result = calculate_circumference(my_radius)
    print(f"Area: {area_result}")
    print(f"Circumference: {circumference_result}")

if __name__ == "__main__":
    main_function()